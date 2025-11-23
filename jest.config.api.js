const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: [
    "<rootDir>/__tests__/api/**/*.test.{ts,js}",
    "<rootDir>/__tests__/utils/**/*.test.{ts,js}",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/app/api/**/*.{js,ts}",
    "src/lib/**/*.{js,ts}",
    "!src/lib/models/index.ts",
    "!**/*.d.ts",
  ],
  testTimeout: 30000,
};

module.exports = createJestConfig(customJestConfig);
