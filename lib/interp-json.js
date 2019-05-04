import { insulate } from '@agoric/jessie'; import { doEval as $i_doEval } from './interp-utils.js';const doEval = insulate($i_doEval);

const jsonEvaluators = insulate({
  array(self, elems) {
    const arr = elems.map(el => doEval(self, el));
    return arr;
  },
  data(_self, val) {
    return val;
  },
  prop(self, name, expr) {
    const val = doEval(self, expr);
    return [name, val];
  },
  record(self, propDefs) {
    const obj = {};
    propDefs.forEach(b => {
      const [name, val] = doEval(self, b);
      self.setComputedIndex(obj, name, val);
    });
    return obj;
  } });


export default jsonEvaluators;