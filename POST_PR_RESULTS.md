# Post-PR integration test results

Branch: `test/integration-all-prs` (merge of PRs #37, #38, #39 + #39's admin-cancel follow-up commit)
Date: 2026-05-16
Local prod build (Node 22.x, Mongo 7 via Docker on macOS arm64)

## What's tested here

The full 12-item battery from the audit's "Should the website be tested for anything else?" list, run against the combined state of all three PRs so we know they're safe to merge together.

| # | Item | Status |
|---|------|--------|
| 1 | Playwright e2e (chromium) against prod build | _pending_ |
| 2 | Lighthouse on key pages (mobile + desktop) | _pending_ |
| 3 | Autocannon load test, 10 public endpoints | _pending_ |
| 4 | axe-core a11y scan via Playwright | _pending_ |
| 5 | Cross-browser Playwright (chromium + firefox + webkit + mobile) | _pending_ |
| 6 | Email rendering across clients | _documented (needs Litmus / ops)_ |
| 7 | Mongo backup + restore drill | _documented (needs Atlas / ops)_ |
| 8 | S3 DR — versioning + restore runbook | _documented (needs AWS / ops)_ |
| 9 | OWASP ZAP baseline scan | _pending_ |
| 10 | Monitoring / alerting smoke test | _documented (needs Sentry/PagerDuty info)_ |
| 11 | GDPR / cookie consent verification | _pending_ |
| 12 | `/api/cron/review-invites` end-to-end | _pending_ |

---

## 1. Playwright e2e

_To be populated_

## 2. Lighthouse

_To be populated_

## 3. Load test (autocannon)

_To be populated_

## 4. axe-core a11y scan

_To be populated_

## 5. Cross-browser Playwright

_To be populated_

## 6. Email rendering across clients — ops-side

react-email's preview server renders in modern Chromium. The risk is that Outlook (Word render engine), older Gmail apps, and iOS Mail Light Mode / Dark Mode all render differently. This audit covered the **code paths** (no `dangerouslySetInnerHTML`, `<EmailButton>` for all CTAs, server-generated URLs); what it does not cover is the **rendered output across real clients**.

**Recommended:**
- Sign up for [Litmus](https://litmus.com/) or [Email on Acid](https://www.emailonacid.com/); pipe the five existing email templates through their preview farm (Outlook 365, Outlook 2019, Gmail web, Gmail iOS, iOS Mail, Apple Mail, Yahoo Mail, dark + light).
- Templates to test:
  - `src/emails/MagicLinkSignIn.tsx`
  - `src/emails/PasswordReset.tsx`
  - `src/emails/CustomerPasswordReset.tsx`
  - `src/emails/VerifyEmail.tsx`
  - `src/emails/QuoteConfirmation.tsx`
  - `src/emails/BookingCancellation.tsx`
  - `src/emails/BookingConfirmation.tsx`
  - `src/emails/ReviewInvite.tsx` (if exists)
- Smoke: send each to a personal Gmail + Outlook + iOS Mail account, confirm the CTA button renders as a button (not a fallback link) and the brand colour shows.

Cannot be executed from a local CLI without paid tooling.

## 7. Mongo backup + restore drill — ops-side

Atlas snapshots happen automatically (configurable cadence in the cluster settings). What's typically missing is proof they **restore**: an untested backup is no backup.

**Recommended drill (do once, document as a runbook):**
1. From Atlas dashboard, select the prod cluster → Snapshots → take a manual snapshot.
2. Restore the snapshot into a fresh dev/staging cluster (Atlas: "Restore to new cluster").
3. Point a throwaway env at the restored cluster (`MONGODB_URI=...`) and run the full Playwright e2e against it.
4. Document the restore-time and the steps in `RUNBOOK.md` (the file already exists).

Cannot be executed from this CLI session without Atlas credentials and an org sign-off to spin up a temporary cluster.

## 8. S3 DR — ops-side

Risk: an admin (or a bug) deletes a car's main image, the listing breaks, and there's no version history to restore from.

**Recommended:**
- Enable bucket versioning on the prod S3 bucket (`aws s3api put-bucket-versioning --bucket <name> --versioning-configuration Status=Enabled`). Idempotent, free until versions accumulate.
- Add a lifecycle rule to expire non-current versions after 90 days (cost cap).
- Add a write-up to `RUNBOOK.md` for "an admin deleted an image — restore it" (`aws s3api list-object-versions` + `aws s3api copy-object --copy-source` to the live key).
- One-time drill: in a non-prod bucket, delete a known key then walk through the restore steps; record the time-to-restore.

Cannot be executed from this CLI session without AWS credentials and bucket name.

## 9. OWASP ZAP baseline

_To be populated_

## 10. Monitoring / alerting smoke test — ops-side

The codebase has structured `logEvent`/`logError` helpers (`src/lib/utils/observability.ts`) but the audit didn't find an external sink wired up (no Sentry/Datadog SDK in deps, no NEXT_PUBLIC_SENTRY_DSN in `.env.example`).

**Recommended (in priority order):**
1. **Error tracking**: add Sentry (`@sentry/nextjs`). Wire the existing `logError` calls to forward to Sentry. Set up a release stamp on deploy. Confirm a synthetic 500 in staging produces a Sentry issue.
2. **Uptime**: a free check on `/api/businessinfo` from BetterUptime / UptimeRobot every 60 s, paging on three consecutive failures.
3. **On-call**: even a PagerDuty solo account costs nothing for one user. Wire the Sentry alert and the uptime alert into one rotation, then trigger a synthetic failure and confirm the page lands on your phone.
4. **Budget alarm**: Vercel function-invocation budget + Atlas data-transfer budget set to fire at 80 % of expected monthly spend.

These are launch-readiness gates more than tests. Cannot be smoke-tested without the underlying accounts existing.

## 11. GDPR / cookie consent verification

_To be populated_

## 12. /api/cron/review-invites end-to-end

_To be populated_

---

## Pre-existing test failures investigated

_To be populated_

---

## Summary

_To be populated once results are in_
