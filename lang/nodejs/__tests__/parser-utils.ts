/// <reference path="../node_modules/@types/jest/index.d.ts"/>
/// <reference path="../../../lib/peg.d.ts"/>
import * as util from 'util';
import tagString from '../../../lib/tag-string.mjs';

let curSrc = '';

export function makeParser(tag: any) {
  const stringTag = tagString<{_pegPosition: string}>(tag);
  return (src: string, doDump = false) => {
    curSrc = src;
    const parsed = stringTag`${src}`;
    if (doDump) {
      slog.info`Dump: ${util.inspect(parsed, {depth: Infinity})}`;
      doDump = false;
    }
    return parsed;
  };
}

export function ast(pos: number, ...args: any[] & {_pegPosition?: string}) {
  args._pegPosition = `${JSON.stringify(curSrc[pos])} #0:${pos}`;
  return args;
}
