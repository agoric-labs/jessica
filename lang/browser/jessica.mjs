import globalEnv from '../nodejs/globalEnv.mjs';
export {translate} from '../../lib/translate.mjs';

export const evaluate = (src) => {
    return globalEnv.confine(src, globalEnv);
};
