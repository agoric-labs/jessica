import iSES from './node_modules/ses/dist/ses.esm.js';
import globalEnv, {insulate} from '../nodejs/globalEnv.mjs';
export {translate} from '../../lib/translate.mjs';

export const globals = {...globalEnv, insulate};
export const SES = iSES;
