/**
 * Dependency-free fakes for the operational E2E suite (no Docker, no extra
 * npm deps). Each binds to 127.0.0.1 on an ephemeral port.
 *
 *  - startFakeS3    : minimal S3-compatible HTTP store (PUT/GET/DELETE + CORS).
 *                     Ignores SigV4 — we only test our presign+PUT+store path.
 *  - startFakeUpstash : Upstash REST shim (/incr /pexpire /pttl /del) backing
 *                       the KV rate limiter, plus /_stats and /_fail controls.
 *  - startSmtpSink  : raw SMTP server that records each message's To/Subject
 *                     into the `_outbox` collection of the given Mongo URI.
 */
import http from "node:http";
import net from "node:net";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { MongoClient } from "mongodb";

/**
 * Spawn the cached mongod binary directly (no mongodb-memory-server dep).
 * Returns { uri, stop }. Ephemeral dbpath, ephemeral port, 127.0.0.1 only.
 */
export async function startMongod() {
  const binDir = path.join(os.homedir(), ".cache/mongodb-binaries");
  const bin = path.join(binDir, "mongod-arm64-darwin-7.0.24");
  if (!existsSync(bin)) {
    throw new Error(`mongod binary not found at ${bin}`);
  }
  // Grab a free port.
  const port = await new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const p = srv.address().port;
      srv.close(() => resolve(p));
    });
  });
  const dbPath = mkdtempSync(path.join(os.tmpdir(), "mmc-mongod-"));
  const proc = spawn(
    bin,
    ["--dbpath", dbPath, "--port", String(port), "--bind_ip", "127.0.0.1"],
    { stdio: "ignore" }
  );
  const uri = `mongodb://127.0.0.1:${port}/MMC?directConnection=true`;

  // Wait until it accepts connections.
  const deadline = Date.now() + 30_000;
  for (;;) {
    if (Date.now() > deadline) throw new Error("mongod did not start in time");
    try {
      const c = new MongoClient(uri, { serverSelectionTimeoutMS: 500 });
      await c.connect();
      await c.db("MMC").command({ ping: 1 });
      await c.close();
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return {
    uri,
    async stop() {
      proc.kill("SIGKILL");
      try {
        rmSync(dbPath, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    },
  };
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () =>
      resolve({ server, port: server.address().port })
    );
  });
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,OPTIONS,HEAD",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "ETag",
};

export async function startFakeS3() {
  const store = new Map(); // pathname -> { body, contentType }
  const server = http.createServer((req, res) => {
    const { pathname } = new URL(req.url, "http://x");
    if (req.method === "OPTIONS") {
      res.writeHead(204, CORS);
      return res.end();
    }
    if (req.method === "PUT") {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        store.set(pathname, {
          body: Buffer.concat(chunks),
          contentType: req.headers["content-type"] || "application/octet-stream",
        });
        res.writeHead(200, { ...CORS, ETag: '"fake-etag"' });
        res.end();
      });
      return;
    }
    if (req.method === "GET" || req.method === "HEAD") {
      const obj = store.get(pathname);
      if (!obj) {
        res.writeHead(404, CORS);
        return res.end("NoSuchKey");
      }
      res.writeHead(200, {
        ...CORS,
        "Content-Type": obj.contentType,
        "Content-Length": obj.body.length,
      });
      return res.end(req.method === "HEAD" ? undefined : obj.body);
    }
    if (req.method === "DELETE") {
      store.delete(pathname);
      res.writeHead(204, CORS);
      return res.end();
    }
    res.writeHead(405, CORS);
    res.end();
  });
  const { port } = await listen(server);
  return { server, port, store, url: `http://127.0.0.1:${port}` };
}

export async function startFakeUpstash() {
  const counts = new Map(); // key -> { count, expireAt }
  let incrCalls = 0;
  let failMode = false;
  const server = http.createServer((req, res) => {
    const { pathname } = new URL(req.url, "http://x");
    const parts = pathname.split("/").filter(Boolean).map(decodeURIComponent);
    const json = (obj) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(obj));
    };
    const cmd = parts[0];
    if (cmd === "_stats") return json({ incrCalls });
    if (cmd === "_reset") {
      counts.clear();
      return json({ ok: true });
    }
    if (cmd === "_fail") {
      failMode = parts[1] === "on";
      return json({ failMode });
    }
    if (failMode) {
      res.writeHead(500);
      return res.end("kv down");
    }
    const now = Date.now();
    if (cmd === "incr") {
      incrCalls++;
      const key = parts.slice(1).join("/");
      const e = counts.get(key);
      if (!e || (e.expireAt && now > e.expireAt)) {
        counts.set(key, { count: 1, expireAt: 0 });
        return json({ result: 1 });
      }
      e.count++;
      return json({ result: e.count });
    }
    if (cmd === "pexpire") {
      const ms = Number(parts[parts.length - 1]);
      const key = parts.slice(1, -1).join("/");
      const e = counts.get(key);
      if (e) e.expireAt = now + ms;
      return json({ result: 1 });
    }
    if (cmd === "pttl") {
      const key = parts.slice(1).join("/");
      const e = counts.get(key);
      return json({ result: e && e.expireAt ? Math.max(0, e.expireAt - now) : -1 });
    }
    if (cmd === "del") {
      counts.delete(parts.slice(1).join("/"));
      return json({ result: 1 });
    }
    json({ result: null });
  });
  const { port } = await listen(server);
  return { server, port, url: `http://127.0.0.1:${port}` };
}

export async function startSmtpSink(mongoUri) {
  const mongo = new MongoClient(mongoUri);
  await mongo.connect();
  const outbox = mongo.db("MMC").collection("_outbox");

  const server = net.createServer((socket) => {
    let buffer = "";
    let inData = false;
    let dataLines = [];
    let authStep = null;
    socket.write("220 fake-smtp ready\r\n");

    socket.on("data", async (chunk) => {
      buffer += chunk.toString("utf8");
      let idx;
      while ((idx = buffer.indexOf("\r\n")) >= 0) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        if (inData) {
          if (line === ".") {
            inData = false;
            const raw = dataLines.join("\n");
            const to = (raw.match(/^To:\s*(.*)$/im) || [])[1]?.trim() || "";
            const subject =
              (raw.match(/^Subject:\s*(.*)$/im) || [])[1]?.trim() || "";
            // Await the persist BEFORE acking 250 so a test that queries
            // _outbox right after the send can't race the write.
            try {
              await outbox.insertOne({ to, subject, receivedAt: new Date() });
            } catch {
              /* ignore */
            }
            dataLines = [];
            socket.write("250 OK queued\r\n");
          } else {
            dataLines.push(line.startsWith("..") ? line.slice(1) : line);
          }
          continue;
        }

        const cmd = line.toUpperCase();
        if (cmd.startsWith("EHLO") || cmd.startsWith("HELO")) {
          socket.write("250-fake-smtp\r\n250 AUTH LOGIN PLAIN\r\n");
        } else if (cmd.startsWith("AUTH LOGIN")) {
          authStep = "user";
          socket.write("334 VXNlcm5hbWU6\r\n");
        } else if (authStep === "user") {
          authStep = "pass";
          socket.write("334 UGFzc3dvcmQ6\r\n");
        } else if (authStep === "pass") {
          authStep = null;
          socket.write("235 2.7.0 Authentication successful\r\n");
        } else if (cmd.startsWith("AUTH PLAIN")) {
          socket.write("235 2.7.0 Authentication successful\r\n");
        } else if (cmd.startsWith("MAIL FROM")) {
          socket.write("250 OK\r\n");
        } else if (cmd.startsWith("RCPT TO")) {
          socket.write("250 OK\r\n");
        } else if (cmd === "DATA") {
          inData = true;
          socket.write("354 End data with <CR><LF>.<CR><LF>\r\n");
        } else if (cmd.startsWith("QUIT")) {
          socket.write("221 Bye\r\n");
          socket.end();
        } else {
          socket.write("250 OK\r\n");
        }
      }
    });
    socket.on("error", () => {});
  });
  const { port } = await listen(server);
  return {
    server,
    port,
    async close() {
      server.close();
      await mongo.close();
    },
  };
}
