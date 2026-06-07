# Contributing

## Pre-commit hooks

This repo uses [husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) to run quality gates on every commit.

On `git commit`, the `.husky/pre-commit` hook runs:

1. `npx lint-staged` — runs `eslint --max-warnings=0` on staged `*.{ts,tsx,js,jsx}` files only (fast).
2. `npm run type-check` — runs `tsc --noEmit` over the whole project. This must check the whole project because TypeScript errors are cross-file.

If either step fails, the commit is aborted. Fix the reported errors and stage the fixes before retrying.

Husky installs itself automatically via the `prepare` script when you run `npm install`.

### Bypassing the hook

Only do this if you have a genuinely good reason (e.g. an in-progress WIP branch on your own fork that you'll fix up before opening a PR). Pass `--no-verify`:

```sh
git commit --no-verify -m "wip: ..."
```

Do not bypass the hook on commits destined for `main`. CI will re-run the same checks and the PR will fail.

## Bundle size budget

A `Bundle size` GitHub Actions job runs [`size-limit`](https://github.com/ai/size-limit) on every pull request and fails the check if any tracked entrypoint exceeds its budget. Config lives at `.size-limit.json`. Tracked entries today:

- **Home page** — `.next/server/app/(main)/page.js` + its client reference manifest.
- **BrowseFleet listing** — `.next/server/app/(main)/BrowseFleet/page.js` + its client reference manifest.
- **Car detail page** — `.next/server/app/(main)/BrowseFleet/[_id]/page.js` + its client reference manifest.
- **All client chunks** — `.next/static/chunks/*.js`, an aggregate budget for JS shipped to the browser.

Each budget is set at "current gzipped size + ~10%" so we catch regressions, not noise.

To run the check locally:

```sh
npm run build   # build can fail at prerender without a Mongo URI; bundles are still emitted
npm run size
```

When you intentionally grow a tracked bundle (new feature, new dependency), update the matching `limit` in `.size-limit.json` by re-running `npm run size` and adding ~10% headroom on top of the new size. Call out the bump in the PR description with a one-line rationale. If a new high-traffic route appears, add it to `.size-limit.json` in the same PR.
