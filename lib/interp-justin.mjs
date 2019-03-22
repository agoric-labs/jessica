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
        const lambda = doEval(self, ...func);
        const evaledArgs = args.map((a) => doEval(self, ...a));
        return lambda(...evaledArgs);
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
        return obj[id];
    },
    index(self, expr) {
        const val = doEval(self, ...expr);
        if (typeof val !== 'number') {
            slog.error(`Index value ${{ val }} is not numeric`);
        }
        return val;
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
        try {
            const val = doEval(self, ...expr);
            return typeof val;
        }
        catch (e) {
            // Special semantics not to fail a plain 'use' on ReferenceError.
            if (expr[0] === 'use') {
                return undefined;
            }
            throw e;
        }
    },
    use(self, name) {
        let b = self.envp;
        while (b !== undefined) {
            if (b[BINDING_NAME] === name) {
                return b[BINDING_GET]();
            }
            b = b[BINDING_PARENT];
        }
        slog.error `ReferenceError: ${name} is not defined`;
    },
    void(self, expr) {
        doEval(self, ...expr);
        return undefined;
    },
});
export default immunize(justinEvaluators);
