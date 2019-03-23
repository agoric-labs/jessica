// DO NOT EDIT - Generated automatically from interp-justin.mjs.ts by tessc
import jsonEvaluators from './interp-json.mjs';
import { BINDING_GET, BINDING_NAME, BINDING_PARENT, doEval } from './interp-utils.mjs';
import { qrepack } from './quasi-utils.mjs';
const justinEvaluators = immunize({
    ...jsonEvaluators,
    'pre:+'(self, expr) {
        return +doEval(self, ...expr);
    },
    'pre:-'(self, expr) {
        return -doEval(self, ...expr);
    },
    'pre:~'(self, expr) {
        return ~doEval(self, ...expr);
    },
    'pre:!'(self, expr) {
        return !doEval(self, ...expr);
    },
    '**'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval ** bval;
    },
    '*'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval * bval;
    },
    '/'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval / bval;
    },
    '%'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval % bval;
    },
    '+'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval + bval;
    },
    '-'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval - bval;
    },
    '<<'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval << bval;
    },
    '>>>'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval >>> bval;
    },
    '>>'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval >> bval;
    },
    '<='(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval <= bval;
    },
    '<'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval < bval;
    },
    '>='(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval >= bval;
    },
    '>'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval > bval;
    },
    '!=='(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval !== bval;
    },
    '==='(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval === bval;
    },
    '&'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval & bval;
    },
    '^'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval ^ bval;
    },
    '|'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval | bval;
    },
    '&&'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval && bval;
    },
    '||'(self, a, b) {
        const aval = doEval(self, ...a);
        const bval = doEval(self, ...b);
        return aval || bval;
    },
    array(self, elems) {
        const arr = elems.reduce((prior, el) => {
            const val = doEval(self, ...el);
            if (el[0] === 'spread') {
                for (const v of val) {
                    prior.push(v);
                }
            }
            else {
                prior.push(val);
            }
            return prior;
        }, []);
        return arr;
    },
    call(self, func, args) {
        const [fname, ...fargs] = func;
        const factual = fname === 'use' ? 'ref' : fname;
        const { getter, thisObj } = doEval(self, factual, ...fargs);
        const evaledArgs = args.map((a) => doEval(self, ...a));
        return self.applyMethod(thisObj, getter(), evaledArgs);
    },
    cond(self, c, t, e) {
        const cval = doEval(self, ...c);
        if (cval) {
            return doEval(self, ...t);
        }
        return doEval(self, ...e);
    },
    def(self, name) {
        return name;
    },
    get(self, objExpr, id) {
        const obj = doEval(self, ...objExpr);
        return { getter: () => obj[id], thisObj: obj };
    },
    index(self, objExpr, expr) {
        const obj = doEval(self, ...objExpr);
        const index = doEval(self, ...expr);
        if (typeof index !== 'number') {
            slog.error(`Index value ${{ index }} is not numeric`);
        }
        return { getter: () => obj[index], thisObj: obj };
    },
    quasi(self, parts) {
        const argsExpr = qrepack(parts);
        return argsExpr.map(arg => doEval(self, ...arg));
    },
    record(self, propDefs) {
        const obj = {};
        propDefs.forEach(b => {
            if (b[0] === 'spreadObj') {
                const spreader = doEval(self, ...b);
                for (const [name, val] of Object.entries(spreader)) {
                    self.setComputedIndex(obj, name, val);
                }
            }
            else {
                const [name, val] = doEval(self, ...b);
                self.setComputedIndex(obj, name, val);
            }
        });
        return obj;
    },
    ref(self, name) {
        let b = self.env();
        while (b !== undefined) {
            if (b[BINDING_NAME] === name) {
                return { getter: b[BINDING_GET], thisObj: undefined };
            }
            b = b[BINDING_PARENT];
        }
        slog.error `ReferenceError: ${{ name }} is not defined`;
    },
    spread(self, arrExpr) {
        const arr = doEval(self, ...arrExpr);
        return arr;
    },
    spreadObj(self, objExpr) {
        const obj = doEval(self, ...objExpr);
        return obj;
    },
    tag(self, tagExpr, quasiExpr) {
        const tag = doEval(self, ...tagExpr);
        const args = doEval(self, ...quasiExpr);
        return tag(...args);
    },
    typeof(self, expr) {
        const [name, ...args] = expr;
        const actual = name === 'use' ? 'use:binding' : name;
        const binding = doEval(self, actual, ...args);
        return binding ? typeof binding[BINDING_GET]() : undefined;
    },
    use(self, name) {
        let b = self.env();
        while (b !== undefined) {
            if (b[BINDING_NAME] === name) {
                return b[BINDING_GET]();
            }
            b = b[BINDING_PARENT];
        }
        slog.error `ReferenceError: ${{ name }} is not defined`;
    },
    'use:binding'(self, name) {
        let b = self.env();
        while (b !== undefined) {
            if (b[BINDING_NAME] === name) {
                return b;
            }
            b = b[BINDING_PARENT];
        }
        return b;
    },
    void(self, expr) {
        doEval(self, ...expr);
        return undefined;
    },
});
export default immunize(justinEvaluators);
