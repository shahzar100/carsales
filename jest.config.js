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
    // Server-only test: pokes `process.env.NODE_ENV` + re-requires
    // iron-session / `src/lib/env.ts` to assert production cookie flags.
    // Belongs only in the api (node) config — running it under jsdom
    // duplicates the result in the test explorer.
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
  return config;
};
