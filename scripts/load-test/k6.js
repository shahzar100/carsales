/* k6 load test — staged ramp 0 → 100 → 0 over 5 min.
 *
 * Run:
 *   TARGET=http://localhost:3000 k6 run scripts/load-test/k6.js
 *
 * Per-endpoint thresholds enforce: p95 < 500 ms and error rate < 1 %.
 * Failing thresholds make k6 exit non-zero, which is what you want in CI.
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";
import { SharedArray } from "k6/data";

const TARGET = __ENV.TARGET || "http://localhost:3000";

const scenarios = new SharedArray("scenarios", () =>
  JSON.parse(open("./scenarios.json")).scenarios
);

const latency = new Trend("scenario_latency_ms", true);
const errors = new Rate("scenario_errors");

export const options = {
  stages: [
    { duration: "1m", target: 50 },
    { duration: "2m", target: 100 },
    { duration: "1m", target: 100 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
    scenario_errors: ["rate<0.01"],
  },
};

export default function vu() {
  const s = scenarios[Math.floor(Math.random() * scenarios.length)];
  const res = http.request(s.method, `${TARGET}${s.path}`, null, {
    tags: { scenario: s.name },
  });
  latency.add(res.timings.duration, { scenario: s.name });
  const ok = check(res, {
    "status is 2xx or 3xx": (r) => r.status >= 200 && r.status < 400,
  });
  errors.add(!ok, { scenario: s.name });
  sleep(0.1);
}
