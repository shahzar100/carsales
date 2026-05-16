#!/usr/bin/env bash
# Post-PR integration test battery — runs the 12-item list from the audit.
# Assumes: prod server up on http://localhost:3000, Mongo on :27017,
# Docker daemon up. Writes results into POST_PR_RESULTS_OUTPUT/ which the
# AUDIT_REPORT consolidation step then folds into POST_PR_RESULTS.md.
set -uo pipefail

OUT=POST_PR_RESULTS_OUTPUT
TARGET=${TARGET:-http://localhost:3000}
mkdir -p "$OUT"

step() { echo; echo "==== $* ===="; }

# ── 1. Playwright e2e ─────────────────────────────────────────
step "1. Playwright e2e (chromium)"
npx playwright install --with-deps chromium 2>&1 | tail -5
PLAYWRIGHT_BASE_URL="$TARGET" npx playwright test \
  --reporter=list --project=chromium 2>&1 | tee "$OUT/01-playwright.log"

# ── 3. autocannon load test ───────────────────────────────────
step "3. autocannon load test (30s × 50 conns × 10 endpoints)"
TARGET="$TARGET" node scripts/load-test/autocannon.mjs \
  --duration 30 --connections 50 2>&1 | tee "$OUT/03-autocannon.log"

# ── 2. Lighthouse (a few key pages, mobile + desktop) ─────────
step "2. Lighthouse"
for url in / /BrowseFleet /CarParts; do
  name=$(echo "${url}" | tr / _ | sed 's/^_//;s/^$/home/')
  for ff in desktop mobile; do
    npx --yes lighthouse "$TARGET$url" \
      --quiet --chrome-flags="--headless=new --no-sandbox" \
      --preset=$ff --only-categories=performance,accessibility,best-practices,seo \
      --output=json --output-path="$OUT/02-lighthouse-${name}-${ff}.json" \
      2>&1 | tail -3
  done
done

# ── 4. axe-core a11y via Playwright inline script ─────────────
step "4. axe-core a11y scan"
npm install --no-save @axe-core/playwright >/dev/null 2>&1
PLAYWRIGHT_BASE_URL="$TARGET" npx playwright test scripts/test-battery-axe.spec.ts \
  --project=chromium --reporter=list 2>&1 | tee "$OUT/04-axe.log"

# ── 5. cross-browser ──────────────────────────────────────────
step "5. cross-browser Playwright"
npx playwright install --with-deps firefox webkit 2>&1 | tail -3
PLAYWRIGHT_BASE_URL="$TARGET" npx playwright test \
  --reporter=list --project=firefox 2>&1 | tee "$OUT/05a-firefox.log"
PLAYWRIGHT_BASE_URL="$TARGET" npx playwright test \
  --reporter=list --project=webkit 2>&1 | tee "$OUT/05b-webkit.log"

# ── 9. OWASP ZAP baseline ─────────────────────────────────────
step "9. OWASP ZAP baseline (Docker)"
docker run --rm -t --network host ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t "$TARGET" -m 2 2>&1 | tee "$OUT/09-zap.log" || true

# ── 11. GDPR / cookie ─────────────────────────────────────────
step "11. cookie behaviour (Playwright)"
PLAYWRIGHT_BASE_URL="$TARGET" npx playwright test scripts/test-battery-cookies.spec.ts \
  --project=chromium --reporter=list 2>&1 | tee "$OUT/11-cookies.log"

# ── 12. cron endpoint ─────────────────────────────────────────
step "12. /api/cron/review-invites"
SECRET=$(grep -E "^CRON_SECRET=" .env.local | cut -d= -f2-)
if [ -n "$SECRET" ]; then
  curl -s -i -X POST -H "Authorization: Bearer $SECRET" \
    "$TARGET/api/cron/review-invites" | tee "$OUT/12-cron.log"
else
  echo "CRON_SECRET not set in .env.local — skipping" | tee "$OUT/12-cron.log"
fi

echo
echo "==== all done; results in $OUT/ ===="
