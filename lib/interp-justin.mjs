// DO NOT EDIT - Generated automatically from interp-justin.mjs.ts by tessc
import jsonEvaluators from './interp-json.mjs';
import { BINDING_GET, BINDING_NAME, BINDING_PARENT, doEval, err, getRef } from './interp-utils.mjs';
import { qrepack } from './quasi-utils.mjs';
const justinEvaluators = immunize({
    ...jsonEvaluators,
    'pre:+'(self, expr) {
        return +doEval(self, expr);
    },
    'pre:-'(self, expr) {
        return -doEval(self, expr);
    },
    'pre:~'(self, expr) {
        return ~doEval(self, expr);
    },
    'pre:!'(self, expr) {
        return !doEval(self, expr);
    },
    '**'(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval ** bval;
    },
    '*'(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval * bval;
    },
    '/'(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval / bval;
    },
    '%'(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval % bval;
    },
    '+'(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval + bval;
    },
    '-'(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval - bval;
    },
    '<<'(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval << bval;
    },
    '>>>'(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval >>> bval;
    },
    '>>'(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval >> bval;
    },
    '<='(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval <= bval;
    },
    '<'(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval < bval;
    },
    '>='(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval >= bval;
    },
    '>'(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval > bval;
    },
    '!=='(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval !== bval;
    },
    '==='(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval === bval;
    },
    '&'(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval & bval;
    },
    '^'(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval ^ bval;
    },
    '|'(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval | bval;
    },
    '&&'(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval && bval;
    },
    '||'(self, a, b) {
        const aval = doEval(self, a);
        const bval = doEval(self, b);
        return aval || bval;
    },
    array(self, elems) {
        const arr = elems.reduce((prior, el) => {
            const val = doEval(self, el);
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
        const { getter, thisObj } = getRef(self, func);
        const evaledArgs = args.map((a) => doEval(self, a));
        const method = getter();
        return self.applyMethod(thisObj, method, evaledArgs);
    },
    cond(self, c, t, e) {
        const cval = doEval(self, c);
        if (cval) {
            return doEval(self, t);
        }
        return doEval(self, e);
    },
    get(self, objExpr, id) {
        const obj = doEval(self, objExpr);
        return obj[id];
    },
    index(self, objExpr, expr) {
        const obj = doEval(self, objExpr);
        const index = doEval(self, expr);
        if (typeof index !== 'number') {
            err(self) `Index value ${{ index }} is not numeric`;
        }
        return obj[index];
    },
    quasi(self, parts) {
        const argsExpr = qrepack(parts);
        return argsExpr.map(arg => doEval(self, arg));
    },
    record(self, propDefs) {
        const obj = {};
        propDefs.forEach(b => {
            if (b[0] === 'spreadObj') {
                const spreader = doEval(self, b);
                for (const [name, val] of Object.entries(spreader)) {
                    self.setComputedIndex(obj, name, val);
                }
            }
            else {
                const [name, val] = doEval(self, b);
                self.setComputedIndex(obj, name, val);
            }
        });
        return obj;
    },
    spread(self, arrExpr) {
        const arr = doEval(self, arrExpr);
        return arr;
    },
    spreadObj(self, objExpr) {
        const obj = doEval(self, objExpr);
        return obj;
    },
    tag(self, tagExpr, quasiExpr) {
        const { getter, thisObj } = getRef(self, tagExpr);
        const args = doEval(self, quasiExpr);
        return self.applyMethod(thisObj, getter(), args);
    },
    typeof(self, expr) {
        if (expr[0] === 'use') {
            const [, name] = expr;
            let b = self.env();
            while (b !== undefined) {
                if (b[BINDING_NAME] === name) {
                    return typeof b[BINDING_GET]();
                }
                b = b[BINDING_PARENT];
            }
            // Special case: just return undefined on missing lookup.
            return undefined;
        }
        const val = doEval(self, expr);
        return typeof val;
    },
    use(self, name) {
        let b = self.env();
        while (b !== undefined) {
            if (b[BINDING_NAME] === name) {
                return b[BINDING_GET]();
            }
            b = b[BINDING_PARENT];
        }
        err(self) `ReferenceError: ${{ name }} is not defined`;
    },
    void(self, expr) {
        doEval(self, expr);
        return undefined;
    },
});
export default immunize(justinEvaluators);
