const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/jest.env.setup.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.component.js"],
  testMatch: ["<rootDir>/__tests__/**/*.test.{ts,tsx,js,jsx}"],
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/__tests__/api/",
    "<rootDir>/__tests__/utils/businessInfo",
    "<rootDir>/__tests__/utils/middleware",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^uuid$": "<rootDir>/__tests__/utils/__mocks__/uuid.ts",
  },
  collectCoverageFrom: [
    "src/**/*.{js,ts,jsx,tsx}",
    "!src/**/*.d.ts",
    "!**/node_modules/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "clover"],
  // Day 8 / Fix 8.3 — coverage ratchet. The plan's target progression is
  // 25% → 35% → 50% → 80% over time. Raise these floors as coverage
  // climbs. After the Day 8 form-test PR added ~55 tests across the
  // four largest forms, branches and functions jumped 10pp / 7pp.
  // Bumped from 25/20/25/25 with single-digit buffer above actuals so
  // CI gates a real regression without blocking unrelated work.
  //
  // The thresholds only apply when `npx jest --coverage` is run; bare
  // `npx jest` is unaffected so dev iteration speed is preserved.
  coverageThreshold: {
    global: {
      statements: 26,
      branches: 25,
      functions: 30,
      lines: 26,
    },
  },
};

// Post-process the resolved config to override next/jest transformIgnorePatterns
// which blocks bson/mongodb ESM modules from being transformed
const jestConfigFn = createJestConfig(customJestConfig);

module.exports = async () => {
  const config = await jestConfigFn();
  config.transformIgnorePatterns = [
    "/node_modules/(?!(bson|mongodb|geist)/)",
    "^.+\\.module\\.(css|sass|scss)$",
  ];
  return config;
};
