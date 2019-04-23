import iSES from './node_modules/ses/dist/ses.esm.js';
import globalEnv from '../nodejs/globalEnv.mjs';
import {buildWhitelist} from './whitelist.js';
export {translate} from '../../lib/translate.mjs';

export const globals = globalEnv;
export const SES = iSES;
export const whitelist = buildWhitelist();
