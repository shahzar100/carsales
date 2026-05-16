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
    // node-only tests with a MongoMemoryServer dependency — they live in
    // __tests__/utils/ but only the api config has the mongo setup hook.
    "<rootDir>/__tests__/utils/getDashboardData",
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
  return config;
};
