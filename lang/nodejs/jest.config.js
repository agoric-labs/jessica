module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
      '^(\..*\.mjs)$': '$1.ts',
  },
  testPathIgnorePatterns: [
    "/node_modules/",
    "/skip-"
  ],
  globals: {
      'ts-jest': {
          tsConfig: './tsconfig.test.json',
      },
  },
};