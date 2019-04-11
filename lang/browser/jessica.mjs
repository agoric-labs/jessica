import iSES from './node_modules/ses/dist/ses.esm.js';
import globalEnv from '../nodejs/globalEnv.mjs';
export {translate} from '../../lib/translate.mjs';

export const evaluate = (src) => {
    return globalEnv.confine(src, globalEnv);
};
export const globals = globalEnv;
export const SES = iSES;
