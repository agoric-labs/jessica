module.exports = {
  "presets": [
   "@babel/preset-typescript"
  ],
  "parserOpts": {
    "plugins": ["objectRestSpread"]
  },
  "plugins": [
    "@babel/plugin-transform-modules-commonjs"
  ]
};
