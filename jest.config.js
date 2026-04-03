const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jsdom",
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
