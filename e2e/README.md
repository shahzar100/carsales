# E2E Tests (Playwright)

Critical-path Playwright tests for Morley Motor Company.

## Scope

10 tests covering the revenue-critical and security-critical journeys.
Not aiming for exhaustive coverage — just the revenue- and security-critical journeys.

| Suite | Test | Why |
| --- | --- | --- |
| `public/home-to-detail` | Home → Browse Fleet → car detail page | Most-trafficked path; covers data fetch + JsonLd |
| `public/car-viewing-booking` | Book a car viewing happy path | Revenue-critical |
| `public/service-booking` | Book a service happy path | Revenue-critical |
| `public/quote-request` | Submit a quote request | Lead capture |
| `public/booking-lookup` | Look up an existing booking | Customer self-service |
| `admin/login` | Admin login success | Auth gate |
| `admin/login-failures` | Wrong password + lockout messaging | Security regression guard |
| `admin/cars-quick-edit` | Cars list → edit handler from Day 3 | Protects most recent change |
| `admin/carparts-crud` | Add → edit → delete (Day 3 + Day 5 wiring) | Covers carparts edit modal + ConfirmDialog |
| `admin/logout-redirect` | Logout, then protected route bounces to login | Auth lifecycle |

## Local run

```bash
npm install
npx playwright install --with-deps chromium  # one-off
npm run test:e2e
```

The local config autostarts `npm run dev` on port 3000. The first run is slower because Next compiles on demand.

## Test data

Tests seed and tear down their own data via the API where possible. Where seeding through the API is awkward (e.g., creating a car without going through the multi-step CarForm UI), the fixtures hit MongoDB directly via the same driver the app uses.

The admin password used by the tests is whatever `ADMIN_PASSWORD` is set to in the environment; locally, `.env.local` controls it.

## Selectors

The codebase has no `data-testid` attributes, so tests rely on:

1. Accessible roles (`role="button"`, `role="alert"`, `role="status"`)
2. Visible text content (button labels, toast messages)
3. Form input `name` attributes
4. URL assertions for navigation

If a future PR adds `data-testid`, the tests can migrate to those incrementally — the current selectors are not load-bearing on implementation details, only on visible UX.
