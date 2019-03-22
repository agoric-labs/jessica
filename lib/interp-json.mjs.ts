import {doEval, Evaluators, IEvalContext} from './interp-utils.mjs';

const jsonEvaluators: Evaluators = {
    array(self: IEvalContext, elems: any[][]) {
        const arr = elems.map(el => doEval(self, ...el));
        return arr;
    },
    data(self: IEvalContext, val: any) {
        return val;
    },
    prop(self: IEvalContext, name: string) {
        return name;
    },
    record(self: IEvalContext, propDefs: any[][]) {
        const obj: Record<string | number, any> = {};
        propDefs.forEach(b => {
            const [name, val] = doEval(self, ...b);
            self.setComputedIndex(obj, name, val);
        });
        return obj;
    },
};

export default jsonEvaluators;
