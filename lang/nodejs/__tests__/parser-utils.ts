/// <reference path="../node_modules/@types/jest/index.d.ts"/>
/// <reference path="../../../lib/peg.d.ts"/>
import * as util from 'util';
import tagString from '../../../lib/tag-string.js';

let curSrc = '';

export function makeParser(tag: IParserTag<any>) {
  const stringTag = tagString<{_pegPosition: string}>(tag);
  return (src: string, doDump = false, doDebug = false) => {
    curSrc = src;
    const dtag = doDebug ? stringTag('DEBUG') : stringTag;
    const parsed = dtag`${src}`;
    if (doDump) {
      // tslint:disable-next-line:no-console
      console.log('Dump:', util.inspect(parsed, {depth: Infinity}));
      doDump = false;
    }
    return parsed;
  };
}

export function ast(pos: number, ...args: any[] & {_pegPosition?: string}) {
  args._pegPosition = `${JSON.stringify(curSrc[pos])} #0:${pos}`;
  return args;
}
