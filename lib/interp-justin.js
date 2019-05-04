import { insulate } from '@agoric/jessie'; import $i_jsonEvaluators from './interp-json.mjs';const jsonEvaluators = insulate($i_jsonEvaluators);
import { BINDING_GET as $i_BINDING_GET, doEval as $i_doEval, err as $i_err,
getRef as $i_getRef, SCOPE_GET as $i_SCOPE_GET } from './interp-utils.mjs';const SCOPE_GET = insulate($i_SCOPE_GET);const getRef = insulate($i_getRef);const err = insulate($i_err);const doEval = insulate($i_doEval);const BINDING_GET = insulate($i_BINDING_GET);
import { qrepack as $i_qrepack } from './quasi-utils.mjs';const qrepack = insulate($i_qrepack);

const justinEvaluators = insulate({
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
      } else {
        prior.push(val);
      }
      return prior;
    }, []);
    return arr;
  },
  call(self, func, args) {
    const { getter, thisObj } = getRef(self, func);
    const evaledArgs = args.map(a => doEval(self, a));
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
      err(self)`Index value ${{ index }} is not numeric`;
    }
    return obj[index];
  },
  quasi(self, parts) {
    const argExprs = qrepack(parts);
    const [template, ...args] = argExprs.map(expr => doEval(self, expr));

    return args.reduce((prior, a, i) =>
    prior + String(a) + template[i + 1], template[0]);
  },
  record(self, propDefs) {
    const obj = {};
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
    const [quasi, parts] = quasiExpr;
    if (quasiExpr[0] !== 'quasi') {
      err(self)`Unrecognized quasi expression ${{ quasi }}`;
    }
    const argExprs = qrepack(parts);
    const args = argExprs.map(expr => doEval(self, expr));
    return self.applyMethod(thisObj, getter(), args);
  },
  typeof(self, expr) {
    if (expr[0] === 'use') {
      const name = expr[1];
      const b = self.scope()[SCOPE_GET](name);
      if (b) {
        return typeof b[BINDING_GET]();
      }
      // Special case: just return undefined on missing lookup.
      return undefined;
    }

    const val = doEval(self, expr);
    return typeof val;
  },
  use(self, name) {
    const b = self.scope()[SCOPE_GET](name);
    if (b) {
      return b[BINDING_GET]();
    }
    err(self)`ReferenceError: ${{ name }} is not defined`;
  },
  void(self, expr) {
    doEval(self, expr);
    return undefined;
  } });


export default justinEvaluators;