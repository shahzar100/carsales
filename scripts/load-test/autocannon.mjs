#!/usr/bin/env node
/**
 * Round-robin autocannon load test driven by scenarios.json.
 *
 * Usage:
 *   TARGET=http://localhost:3000 node scripts/load-test/autocannon.mjs
 *     [--duration 30] [--connections 50] [--pipelining 1]
 *
 * Reads each scenario in order and runs a separate autocannon pass per
 * endpoint so per-endpoint p95s are comparable. Prints a one-line
 * summary per endpoint plus a CSV at the end suitable for pasting into
 * the audit report.
 *
 * Uses `npx autocannon` so no global install is needed.
 */

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith("--")) acc.push([cur.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);

const TARGET = process.env.TARGET || "http://localhost:3000";
const DURATION = String(args.duration || 30);
const CONNECTIONS = String(args.connections || 50);
const PIPELINING = String(args.pipelining || 1);

const { scenarios } = JSON.parse(
  readFileSync(resolve(__dirname, "scenarios.json"), "utf8")
);

const results = [];

for (const s of scenarios) {
  const url = `${TARGET}${s.path}`;
  console.log(
    `\n=== ${s.name} — ${s.method} ${url} | ${DURATION}s @ ${CONNECTIONS} conns ===`
  );
  const out = await runAutocannon([
    "-d", DURATION,
    "-c", CONNECTIONS,
    "-p", PIPELINING,
    "--method", s.method,
    "--renderStatusCodes",
    url,
  ]);
  results.push({ name: s.name, summary: extractSummary(out) });
}

console.log("\n=== CSV summary ===");
console.log("scenario,req_per_sec,latency_p50_ms,latency_p95_ms,latency_p99_ms,errors,non2xx");
for (const r of results) {
  const s = r.summary;
  console.log(
    `${r.name},${s.reqSec},${s.p50},${s.p95},${s.p99},${s.errors},${s.non2xx}`
  );
}

function runAutocannon(extraArgs) {
  return new Promise((res, rej) => {
    const proc = spawn("npx", ["--yes", "autocannon", ...extraArgs], {
      stdio: ["ignore", "pipe", "inherit"],
    });
    let buf = "";
    proc.stdout.on("data", (chunk) => {
      buf += chunk.toString();
      process.stdout.write(chunk);
    });
    proc.on("error", rej);
    proc.on("close", () => res(buf));
  });
}

function extractSummary(stdout) {
  // autocannon prints a final table; pull the avg req/sec and latency p50/p95/p99
  const lines = stdout.split("\n");
  const latencyRow = lines.find((l) => l.includes("Latency")) || "";
  const reqRow = lines.find((l) => l.includes("Req/Sec")) || "";
  const errLine = lines.find((l) => l.match(/\d+ errors? \(\d+ timeouts?\)/));
  const non2xxLine = lines.find((l) => l.includes("non 2xx responses"));

  const num = (s) => {
    const m = s && s.match(/[\d.]+/g);
    return m ? m[m.length - 1] : "?";
  };

  // crude column pulls — autocannon uses cliui so spacing is stable
  const lat = latencyRow.split(/\s+/).filter(Boolean);
  const req = reqRow.split(/\s+/).filter(Boolean);

  return {
    reqSec: req[req.length - 2] || "?",
    p50: lat[2] || "?",
    p95: lat[5] || "?",
    p99: lat[6] || "?",
    errors: errLine ? num(errLine) : "0",
    non2xx: non2xxLine ? num(non2xxLine) : "0",
  };
}
