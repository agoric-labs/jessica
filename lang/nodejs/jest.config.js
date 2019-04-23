module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
      '^(\\..*\\.mjs)$': '$1.ts',
  },
  testPathIgnorePatterns: [
    // "/node_modules/",
    "/skip-",
    "parser-utils\\.ts$",
  ],
  transformIgnorePatterns: [
    '\\.tsx?$',
  ],
  globals: {
      'ts-jest': {
          tsConfig: './tsconfig.test.json',
          babelConfig: './babelrc.test.json',
      },
  },
};
