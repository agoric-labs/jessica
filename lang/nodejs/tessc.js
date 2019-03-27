const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const babelTs = require('@babel/preset-typescript');
const thisdir = path.dirname(process.argv[1]);
const opts = {
    "sourceType": "module",
    "presets": [
      babelTs
    ],
    "parserOpts": {
      "plugins": ["objectRestSpread"]
    },
    "generatorOpts": {
      "compact": false,
      "ast": true,
      "retainLines": true
    },
    "plugins": [
      thisdir + "/babel-tessie"
    ]
};

const compile = async (srcs) => {
  const compiled = {};
  for (const src of srcs) {
    // console.log(`Compiling ${src}`);
    const mjs = src.replace(/\.mjs\.ts$/, '.mjs');
    const dst = mjs === src ? src + '.js' : mjs;
    const base = src.substr(src.lastIndexOf('/') + 1);
    const {ast, code: out} = await babel.transformFileAsync(src, opts);
    compiled[dst] = `// DO NOT EDIT - Generated automatically from ${base} by tessc
${out}`
  }
  for (const dst in compiled) {
    // console.log(`Writing ${dst}`);
    await new Promise((resolve, reject) => {
      fs.writeFile(dst, compiled[dst], 'utf-8', (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }
};

const files = process.argv.slice(2);
if (files.length > 0) {
  compile(files);
} else {
  console.error('You must specify the *.mjs.ts files to compile.');
  process.exit(1);
  const dir = './lib';
  fs.readdir(dir, async (err, files) => {
    if (err) {
      console.log(`Cannot read ${dir}`, e)
      process.exit(1);
    }
    await compile(files.filter(f => f.match(/\.ts$/)).map(f => `${dir}/${f}`));
  });
}