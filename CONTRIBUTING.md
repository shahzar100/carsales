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
