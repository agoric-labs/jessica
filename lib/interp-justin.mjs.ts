import jsonEvaluators from './interp-json.mjs';
import {BINDING_GET, BINDING_NAME, BINDING_PARENT,
    doEval, err, Evaluator, IEvalContext} from './interp-utils.mjs';
import {qrepack} from './quasi-utils.mjs';

const justinEvaluators: Record<string, Evaluator> = {
    ...jsonEvaluators,
    'pre:+'(self: IEvalContext, expr: any[]) {
        return +doEval(self, expr);
    },
    'pre:-'(self: IEvalContext, expr: any[]) {
        return -doEval(self, expr);
    },
    'pre:~'(self: IEvalContext, expr: any[]) {
        return ~doEval(self, expr);
    },
    'pre:!'(self: IEvalContext, expr: any[]) {
        return !doEval(self, expr);
    },
    '**'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval ** bval;
    },
    '*'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval * bval;
    },
    '/'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval / bval;
    },
    '%'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval % bval;
    },
    '+'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval + bval;
    },
    '-'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval - bval;
    },
    '<<'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval << bval;
    },
    '>>>'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval >>> bval;
    },
    '>>'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval >> bval;
    },
    '<='(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval <= bval;
    },
    '<'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval < bval;
    },
    '>='(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval >= bval;
    },
    '>'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval > bval;
    },
    '!=='(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval !== bval;
    },
    '==='(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval === bval;
    },
    '&'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval & bval;
    },
    '^'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval ^ bval;
    },
    '|'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval | bval;
    },
    '&&'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval && bval;
    },
    '||'(self: IEvalContext, a: any[], b: any[]) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval || bval;
    },
    array(self: IEvalContext, elems: any[][]) {
        const arr = elems.reduce((prior, el) => {
            const val = doEval(self, el);
            if (el[0] === 'spread') {
                for (const v of val) {
                    prior.push(v);
                }
            } else {
                prior.push(val);
            }
            return prior;
        }, []);
        return arr;
    },
    call(self: IEvalContext, func: any[], args: any[][]) {
        const [fname] = func;
        const factual = fname === 'use' ? 'ref' : fname;
        const {getter, thisObj} = doEval(self, func, factual);
        const evaledArgs = args.map((a) => doEval(self, a));
        return self.applyMethod(thisObj, getter(), evaledArgs);
    },
    cond(self: IEvalContext, c: any[], t: any[], e: any[]) {
        const cval = doEval(self, c);
        if (cval) {
            return doEval(self, t);
        }
        return doEval(self, e);
    },
    def(_self: IEvalContext, name: string) {
        return name;
    },
    get(self: IEvalContext, objExpr: any[], id: string) {
        const obj = doEval(self, objExpr);
        return {getter: () => obj[id], thisObj: obj};
    },
    index(self: IEvalContext, objExpr: any[], expr: any[]) {
        const obj = doEval(self, objExpr);
        const index = doEval(self, expr);
        if (typeof index !== 'number') {
            err(self)`Index value ${{index}} is not numeric`;
        }
        return {getter: () => obj[index], thisObj: obj};
    },
    quasi(self: IEvalContext, parts: any[]) {
        const argsExpr = qrepack(parts);
        return argsExpr.map(arg => doEval(self, arg));
    },
    record(self: IEvalContext, propDefs: any[][]) {
        const obj: Record<string | number, any> = {};
        propDefs.forEach(b => {
            if (b[0] === 'spreadObj') {
                const spreader = doEval(self, b);
                for (const [name, val] of Object.entries(spreader)) {
                    self.setComputedIndex(obj, name, val);
                }
            } else {
                const [name, val] = doEval(self, b);
                self.setComputedIndex(obj, name, val);
            }
        });
        return obj;
    },
    ref(self: IEvalContext, name: string) {
        let b = self.env();
        while (b !== undefined) {
            if (b[BINDING_NAME] === name) {
                return {getter: b[BINDING_GET], thisObj: undefined};
            }
            b = b[BINDING_PARENT];
        }
        err(self)`ReferenceError: ${{name}} is not defined`;
    },
    spread(self: IEvalContext, arrExpr: any[][]) {
        const arr = doEval(self, arrExpr);
        return arr;
    },
    spreadObj(self: IEvalContext, objExpr: any[]) {
        const obj = doEval(self, objExpr);
        return obj;
    },
    tag(self: IEvalContext, tagExpr: any[], quasiExpr: any[]) {
        const tag = doEval(self, tagExpr);
        const args = doEval(self, quasiExpr);
        return tag(...args);
    },
    typeof(self: IEvalContext, expr: any[]) {
        const [name, ...args] = expr;
        const actual = name === 'use' ? 'use:binding' : name;
        const binding = doEval(self, actual, ...args);
        return binding ? typeof binding[BINDING_GET]() : undefined;
    },
    use(self: IEvalContext, name: string) {
        let b = self.env();
        while (b !== undefined) {
            if (b[BINDING_NAME] === name) {
                return b[BINDING_GET]();
            }
            b = b[BINDING_PARENT];
        }
        err(self)`ReferenceError: ${{name}} is not defined`;
    },
    'use:binding'(self: IEvalContext, name: string) {
        let b = self.env();
        while (b !== undefined) {
            if (b[BINDING_NAME] === name) {
                return b;
            }
            b = b[BINDING_PARENT];
        }
        return b;
    },
    void(self: IEvalContext, expr: any[]) {
        doEval(self, expr);
        return undefined;
    },
};

export default justinEvaluators;
