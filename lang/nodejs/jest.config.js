module.exports = {
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    // "/node_modules/",
    "/skip-",
    "parser-utils\\.ts$",
  ],
  transform: {
    '\\.js$': 'babel-jest',
    '\\.ts$': 'babel-jest',
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@agoric/jessie|@michaelfig/slog))"
  ],
};
