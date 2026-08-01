const _nextJestMod = require("next/jest");
const nextJest = _nextJestMod.default ?? _nextJestMod;

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jsdom",
  // Restrict haste-map scanning to project source dirs only.
  // This prevents .claude/worktrees/ from polluting the module index
  // with duplicate mock files and causing Jest to exit silently.
  roots: ["<rootDir>/src", "<rootDir>/__tests__"],
  setupFiles: ["<rootDir>/jest.env.setup.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.component.js"],
  testMatch: ["<rootDir>/__tests__/**/*.test.{ts,tsx,js,jsx}"],
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/.claude/",
    "<rootDir>/node_modules/",
    "<rootDir>/__tests__/api/",
    // These files carry @jest-environment node — run them under jest.config.api.js
    // where the node environment loads cleanly. Loading them under jsdom causes
    // LegacyFakeTimers to be empty due to a Node 24 circular-dep race.
    "<rootDir>/__tests__/app/api/",
    "<rootDir>/__tests__/utils/",
    "<rootDir>/__tests__/utils/businessInfo",
    "<rootDir>/__tests__/utils/middleware",
    "<rootDir>/__tests__/utils/getDashboardData",
    "<rootDir>/__tests__/utils/auth",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^uuid$": "<rootDir>/__tests__/utils/__mocks__/uuid.ts",
  },
  // jsdom config runs UI / app shells / contexts / hooks. API route
  // handlers + server-only lib code are covered by jest.config.api.js
  // — listing them here would inflate the 0% rows in the Test Explorer
  // coverage panel since they never execute under jsdom.
  collectCoverageFrom: [
    "src/**/*.{js,ts,jsx,tsx}",
    "!src/**/*.d.ts",
    "!src/app/api/**",
    "!src/lib/mongodb.ts",
    "!src/lib/models/**",
    "!src/lib/env.ts",
    "!src/lib/utils/auth.ts",
    "!src/lib/utils/businessInfo.ts",
    "!src/emails/**",
    "!**/node_modules/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "clover"],
  // Local coverage floor. Applies only when `npx jest --coverage` is
  // run; bare `npx jest` is unaffected so dev iteration speed is
  // preserved. The plan's target progression is 25% → 35% → 50% → 80%
  // over time — raise these as coverage climbs.
  coverageThreshold: {
    global: {
      statements: 25,
      branches: 20,
      functions: 25,
      lines: 25,
    },
  },
};

// Post-process the resolved config to override next/jest transformIgnorePatterns
// which blocks bson/mongodb ESM modules from being transformed
const jestConfigFn = createJestConfig(customJestConfig);

module.exports = async () => {
  const config = await jestConfigFn();
  config.transformIgnorePatterns = [
    "/node_modules/(?!(bson|mongodb|geist|next-auth|@auth|@panva|jose|oauth4webapi|preact-render-to-string|preact)/)",
    "^.+\\.module\\.(css|sass|scss)$",
  ];
  // Exclude .claude worktrees from jest-haste-map module scanning so it
  // doesn't see duplicate mock files and crash before running tests.
  config.modulePathIgnorePatterns = [
    ...(config.modulePathIgnorePatterns ?? []),
    "<rootDir>/.claude/",
  ];
  config.watchPathIgnorePatterns = [
    ...(config.watchPathIgnorePatterns ?? []),
    "<rootDir>/.claude/",
  ];
  return config;
};
