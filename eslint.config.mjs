import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "tools/**",
      "e2e/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
  // Test files: relax rules that don't apply to test code idioms.
  // - `any` is pragmatic for mock typing
  // - CommonJS `require()` is needed for dynamic mock loading and jest module mocks
  // - Triple-slash references are the canonical way to pull in ambient testing-library types
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
    },
  },
  // Email templates: apostrophes in human-facing copy are fine. Downgrade to warn
  // so we still notice unescaped angle brackets etc., without blocking CI on
  // legitimate copy. Tracked separately in audit §6.3.
  {
    files: ["src/emails/**/*.{ts,tsx}"],
    rules: {
      "react/no-unescaped-entities": "warn",
    },
  },
];

export default eslintConfig;
