import globalEnv from './globalEnv.mjs';
export {translate} from '../../lib/translate.mjs';

export const confine = (src) => {
    return globalEnv.confine(src, globalEnv);
};
