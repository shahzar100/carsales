/**
 * ESLint Flat Config — fully native, no FlatCompat / @rushstack/eslint-patch.
 *
 * The legacy compat path routes `require()` through @rushstack/eslint-patch,
 * which on Node ≥22 causes CJS helpers in eslint-plugin-react and
 * @typescript-eslint to initialise with empty exports (circular-dep races).
 * Loading all plugins as direct ESM `import`s avoids that code path.
 */
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = [
  // ── Global ignores ──────────────────────────────────────────────────────
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".claude/**",
      "out/**",
      "build/**",
      "coverage/**",
      "tools/**",
      "e2e/**",
      "playwright-report/**",
      "test-results/**",
      "POST_PR_RESULTS_OUTPUT/**",
      "next-env.d.ts",
    ],
  },

  // ── React-hooks (works fine; react/jsx-key etc. disabled — see note below) ─
  // eslint-plugin-react@7.37.5 has circular-dependency initialisation races in
  // Node 24: astUtil, propTypesUtil etc. return {} causing every rule to crash.
  // react-hooks is a separate plugin with no such dependency, so it works.
  // Re-enable eslint-plugin-react once a Node 24–compatible release ships.
  {
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // ── Next.js (core-web-vitals) ─────────────────────────────────────────────
  {
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },

  // ── jsx-a11y ──────────────────────────────────────────────────────────────
  {
    plugins: { "jsx-a11y": jsxA11y },
    rules: { ...jsxA11y.configs.recommended.rules },
  },

  // ── TypeScript ───────────────────────────────────────────────────────────
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    plugins: { "@typescript-eslint": tsPlugin },
    languageOptions: { parser: tsParser },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },

  // ── Test files ───────────────────────────────────────────────────────────
  {
    files: [
      "__tests__/**/*.{ts,tsx,js,jsx}",
      "jest.config.js",
      "jest.config.api.js",
      "jest.setup.js",
      "jest.setup.component.js",
      "jest.env.setup.js",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      // jsx-a11y rules fire on inline JSX literals used as mock/fixture data
      // inside test files — these aren't real rendered components so the a11y
      // rules produce false positives. Disable in test scope.
      "jsx-a11y/anchor-is-valid": "off",
      "jsx-a11y/anchor-has-content": "off",
      "jsx-a11y/no-noninteractive-element-to-interactive-role": "off",
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      "jsx-a11y/interactive-supports-focus": "off",
    },
  },

  // ── Email templates (no-op on Node 24 — react plugin disabled) ──────────
  // {
  //   files: ["src/emails/**/*.{ts,tsx}"],
  //   rules: { "react/no-unescaped-entities": "warn" },
  // },
];

export default eslintConfig;
