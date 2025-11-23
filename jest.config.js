const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/__tests__/**/*.test.ts",
    "<rootDir>/__tests__/**/*.test.js",
  ],
  collectCoverageFrom: [
    "src/app/api/**/*.{js,ts}",
    "src/lib/**/*.{js,ts}",
    "!src/lib/models/index.ts", // Exclude the main models file as it's mostly setup
    "!**/*.d.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testTimeout: 30000, // 30 seconds for database operations
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
