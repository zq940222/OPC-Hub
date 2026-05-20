import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  testMatch: ["<rootDir>/src/**/__tests__/**/*.(test|spec).(ts|tsx)"],
  modulePathIgnorePatterns: ["<rootDir>/.bun-cache/", "<rootDir>/.bun-tmp/"],
  testPathIgnorePatterns: ["<rootDir>/.bun-cache/", "<rootDir>/.bun-tmp/", "<rootDir>/node_modules/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default createJestConfig(config);
