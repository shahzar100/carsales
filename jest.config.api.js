const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.env.setup.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: [
    "<rootDir>/__tests__/api/**/*.test.{ts,js}",
    "<rootDir>/__tests__/utils/**/*.test.{ts,js}",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^uuid$": "<rootDir>/__tests__/utils/__mocks__/uuid.ts",
  },
  collectCoverageFrom: [
    "src/app/api/**/*.{js,ts}",
    "src/lib/**/*.{js,ts}",
    "!src/lib/models/index.ts",
    "!**/*.d.ts",
  ],
  testTimeout: 30000,
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
