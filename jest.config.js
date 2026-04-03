module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.spec.ts"],
  moduleNameMapper: {
    "^@modules/(.*)$": "<rootDir>/src/modules/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testTimeout: 10000,
  globals: {
    "ts-jest": {
      tsconfig: {
        target: "ES2022",
        module: "commonjs",
        esModuleInterop: true,
        skipLibCheck: true,
        moduleResolution: "node",
        baseUrl: ".",
        rootDir: ".",
      },
    },
  },
};
