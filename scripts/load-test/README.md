# Load tests

Lightweight load-tests for the public API surface. Designed to be run
against a **local production build** (`npm run build && npm run start`)
or a staging deployment — **never** against production without an
explicit ops sign-off.

Two flavours are provided so you can pick whichever tool you already
have on PATH:

- `autocannon` — pure-Node, zero-config, good for quick burst tests
- `k6` — better for staged ramp profiles and per-endpoint thresholds

Both share the same set of representative requests defined in
[`scenarios.json`](./scenarios.json). Add/remove scenarios there to
re-shape coverage.

## What's exercised

The public, GET-mostly surface — the endpoints a synthetic browser
crawl would hit. We deliberately exclude:

- All `/api/admin/**` (would require a session cookie + 2FA)
- All write endpoints under `/api/bookings/**` and `/api/auth/**`
  (rate-limited; we don't want to spam Mongo with junk rows)
- `/api/cron/review-invites` (sends real emails when the secret matches)

The endpoints we hit:

| Endpoint                       | Method | Notes                                |
| ------------------------------ | ------ | ------------------------------------ |
| `/`                            | GET    | Home page, server-rendered           |
| `/BrowseFleet`                 | GET    | Fleet listing                        |
| `/CarParts`                    | GET    | Parts catalogue                      |
| `/Services`                    | GET    | Services landing                     |
| `/api/about`                   | GET    | Public site copy                     |
| `/api/businessinfo`            | GET    | Public business info                 |
| `/api/carparts`                | GET    | Public parts query                   |
| `/api/carparts?brand=Ford`     | GET    | Filter path through the same handler |
| `/sitemap.xml`                 | GET    | Static                               |
| `/robots.txt`                  | GET    | Static                               |

## How to run

```sh
# 1) build + start a prod server in another shell
npm run build && npm run start          # serves on http://localhost:3000

# 2) run a quick 30-second smoke at 50 concurrent connections
TARGET=http://localhost:3000 node scripts/load-test/autocannon.mjs \
  --duration 30 --connections 50

# 3) heavier soak (5 min, 200 connections)
TARGET=http://localhost:3000 node scripts/load-test/autocannon.mjs \
  --duration 300 --connections 200

# 4) k6 (if installed): staged ramp 0→100→0 over 5 min
TARGET=http://localhost:3000 k6 run scripts/load-test/k6.js
```

`autocannon.mjs` uses `npx autocannon` under the hood so you don't need
a global install — Node will fetch the published binary on first run.

## Interpreting results

A healthy local prod build on a developer laptop (M-series, 16 GB) should
sustain **≥ 1500 req/s on GET `/api/businessinfo`** with sub-50 ms p95.
Anything substantially worse points at a Mongo round-trip on every
request (no caching layer) — see the dynamic-rendering finding in the
audit report.

For each run autocannon prints a latency histogram and req/s; copy
those into the audit report if you want before/after numbers.
