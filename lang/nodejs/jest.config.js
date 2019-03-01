module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
      '^(\..*\.mjs)$': '$1.ts',
  },
  globals: {
      'ts-jest': {
          tsConfig: './tsconfig.test.json',
      },
  },
};