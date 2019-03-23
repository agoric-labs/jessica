// DO NOT EDIT - Generated automatically from interp-json.mjs.ts by tessc
import { doEval } from './interp-utils.mjs';
const jsonEvaluators = immunize({
    array(self, elems) {
        const arr = elems.map(el => doEval(self, ...el));
        return arr;
    },
    data(_self, val) {
        return val;
    },
    prop(_self, name) {
        return name;
    },
    record(self, propDefs) {
        const obj = {};
        propDefs.forEach(b => {
            const [name, val] = doEval(self, ...b);
            self.setComputedIndex(obj, name, val);
        });
        return obj;
    },
});
export default immunize(jsonEvaluators);
