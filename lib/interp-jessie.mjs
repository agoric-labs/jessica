import { insulate } from '@agoric/jessie'; // TODO: Hoisting of functionDecls.

import $i_justinEvaluators from './interp-justin.mjs';const justinEvaluators = insulate($i_justinEvaluators);
import { addBinding as $i_addBinding, BINDING_GET as $i_BINDING_GET, doEval as $i_doEval, err as $i_err,
getRef as $i_getRef, SCOPE_GET as $i_SCOPE_GET, SCOPE_SET as $i_SCOPE_SET } from './interp-utils.mjs';const SCOPE_SET = insulate($i_SCOPE_SET);const SCOPE_GET = insulate($i_SCOPE_GET);const getRef = insulate($i_getRef);const err = insulate($i_err);const doEval = insulate($i_doEval);const BINDING_GET = insulate($i_BINDING_GET);const addBinding = insulate($i_addBinding);
const MAGIC_EXIT = insulate({ toString: () => 'MAGIC_EXIT' });

const matchPropPattern = insulate((self, pattern, remaining) => {
  const pos = pattern._pegPosition;
  const oldPos = self.pos(pos);
  try {
    switch (pattern[0]) {
      case 'restObj':{
          // Convert remaining back to an object.
          const pat = pattern[1];
          const obj = {};
          remaining.forEach((value, key) =>
          self.setComputedIndex(obj, key, value));
          return matchPattern(self, pat, obj);
        }
      case 'matchProp':{
          // Match a named key against a pattern.
          const [key, pat] = pattern.slice(1);
          const val = remaining.get(key);
          remaining.delete(key);
          return matchPattern(self, pat, val);
        }
      case 'optionalProp':{
          // Match a named key against a pattern, defaulting.
          const [key, pat, dflt] = pattern.slice(1);
          const val = remaining.has(key) ? remaining.get(key) : doEval(self, dflt);
          remaining.delete(key);
          return matchPattern(self, pat, val);
        }

      default:{
          throw err(self)`Cannot match property pattern ${{ pattern }}: not implemented`;
        }}

  } finally {
    self.pos(oldPos);
  }
});

const matchPattern = insulate((self, pattern, value) => {
  const pos = pattern._pegPosition;
  const oldPos = self.pos(pos);
  try {
    switch (pattern[0]) {
      case 'def':{
          return [[pattern[1], value]];
        }

      case 'matchData':{
          if (value === pattern[1]) {
            return [];
          }
          throw [MAGIC_EXIT, 'matchFailed'];
        }

      case 'matchArray':{
          return pattern.slice(1).reduce((prior, pat, i) => {
            let bindings;
            if (pat[0] === 'rest') {
              bindings = matchPattern(self, pat[1], value.slice(i));
            } else {
              bindings = matchPattern(self, pat, value[i]);
            }
            bindings.forEach(binding => prior.push(binding));
            return prior;
          }, []);
        }

      case 'matchRecord':{
          const remaining = makeMap(Object.entries(value));
          return pattern[1].reduce((prior, pat) => {
            matchPropPattern(self, pat, remaining).
            forEach(binding => prior.push(binding));
            return prior;
          }, []);
        }

      default:{
          throw err(self)`Cannot match ${{ pattern }}: not implemented`;
        }}

  } finally {
    self.pos(oldPos);
  }
});

const bindPattern = insulate((self, pattern, mutable, value) => {
  let bindings;
  try {
    bindings = matchPattern(self, pattern, value);
  } catch (e) {
    if (e[0] === MAGIC_EXIT && e[1] === 'matchFailed') {
      return;
    }
    throw e;
  }

  bindings.forEach(binding => {
    const [name, val] = binding;
    addBinding(self, name, mutable, val);
  });
});

const evalSwitchClause = insulate((self, clause, val) => {
  switch (clause[0]) {
    case 'clause':{
        const [guards, body] = clause.slice(1);
        for (const guard of guards) {
          if (guard[0] === 'case') {
            const expr2 = guard[1];
            const val2 = doEval(self, expr2);
            if (val !== val2) {
              // Try the next case.
              continue;
            }
          } else if (guard[0] !== 'default') {
            throw err(self)`Unrecognized case expression ${{ guard }}`;
          }
          // Evaluate the body, which in Jessie will do a nonlocal exit.
          return doEval(self, body);
        }
        break;
      }

    default:{
        throw err(self)`Unrecognized switch clause ${{ clause }}`;
      }}

});

const doApply = insulate((self, args, bindings, body) => {
  const oldScope = self.scope(true);
  try {
    // Bind the arguments.
    const pattern = ['matchArray', ...bindings];
    bindPattern(self, pattern, true, args);

    // Evaluate the body.
    try {
      return doEval(self, body);
    } catch (e) {
      if (Array.isArray(e) && e[0] === MAGIC_EXIT) {
        if (e[1] === 'return') {
          // Some part of the body executed `return`;
          return e[2];
        } else {
          throw err(self)`Invalid function exit kind ${{ e: e[1] }}`;
        }
      }
      // Not a magic value, just throw normally.
      throw e;
    }
  } finally {
    self.scope(oldScope);
  }
});

const jessieEvaluators = insulate({
  ...justinEvaluators,
  '='(self, lValue, rValue) {
    const { setter } = getRef(self, lValue);
    const val = doEval(self, rValue);
    return setter(val);
  },
  'pre:++'(self, lValue) {
    const { getter, setter } = getRef(self, lValue);
    return setter(getter() + 1);
  },
  'pre:--'(self, lValue) {
    const { getter, setter } = getRef(self, lValue);
    return setter(getter() - 1);
  },
  '++'(self, lValue) {
    const { getter, setter } = getRef(self, lValue);
    const val = getter();
    setter(val + 1);
    return val;
  },
  '--'(self, lValue) {
    const { getter, setter } = getRef(self, lValue);
    const val = getter();
    setter(val - 1);
    return val;
  },
  '*='(self, lValue, rValue) {
    const { getter, setter } = getRef(self, lValue);
    const val = doEval(self, rValue);
    return setter(getter() * val);
  },
  '/='(self, lValue, rValue) {
    const { getter, setter } = getRef(self, lValue);
    const val = doEval(self, rValue);
    return setter(getter() / val);
  },
  '%='(self, lValue, rValue) {
    const { getter, setter } = getRef(self, lValue);
    const val = doEval(self, rValue);
    return setter(getter() % val);
  },
  '+='(self, lValue, rValue) {
    const { getter, setter } = getRef(self, lValue);
    const val = doEval(self, rValue);
    return setter(getter() + val);
  },
  '-='(self, lValue, rValue) {
    const { getter, setter } = getRef(self, lValue);
    const val = doEval(self, rValue);
    return setter(getter() - val);
  },
  '<<='(self, lValue, rValue) {
    const { getter, setter } = getRef(self, lValue);
    const val = doEval(self, rValue);
    return setter(getter() << val);
  },
  '>>='(self, lValue, rValue) {
    const { getter, setter } = getRef(self, lValue);
    const val = doEval(self, rValue);
    return setter(getter() >> val);
  },
  '>>>='(self, lValue, rValue) {
    const { getter, setter } = getRef(self, lValue);
    const val = doEval(self, rValue);
    return setter(getter() >>> val);
  },
  '&='(self, lValue, rValue) {
    const { getter, setter } = getRef(self, lValue);
    const val = doEval(self, rValue);
    return setter(getter() & val);
  },
  '^='(self, lValue, rValue) {
    const { getter, setter } = getRef(self, lValue);
    const val = doEval(self, rValue);
    return setter(getter() ^ val);
  },
  '|='(self, lValue, rValue) {
    const { getter, setter } = getRef(self, lValue);
    const val = doEval(self, rValue);
    return setter(getter() | val);
  },
  '**='(self, lValue, rValue) {
    const { getter, setter } = getRef(self, lValue);
    const val = doEval(self, rValue);
    return setter(getter() ** val);
  },
  arrow(self, params, body) {
    return self.evaluators.lambda(self, params, body);
  },
  bind(self, patt, expr) {
    const val = doEval(self, expr);
    return [patt, val];
  },
  block(self, statements) {
    const label = self.setLabel(undefined);
    try {
      statements.forEach(s => doEval(self, s));
    } catch (e) {
      if (label !== undefined && e[0] === MAGIC_EXIT && e[2] === label) {
        switch (e[1]) {
          case 'break':{
              return;
            }
          case 'continue':{
              throw err(self)`Cannot continue from block labelled ${{ label }}`;
            }}

      }
      // We weren't the target of this exit.
      throw e;
    }
  },
  break(_self, label) {
    throw [MAGIC_EXIT, 'break', label];
  },
  catch(_self, pattern, body) {
    return { bindings: [pattern], body };
  },
  const(self, binds) {
    binds.forEach(b => {
      const [pattern, val] = doEval(self, b);
      bindPattern(self, pattern, false, val);
    });
  },
  continue(_self, label) {
    throw [MAGIC_EXIT, 'continue', label];
  },
  def(_self, name) {
    return name;
  },
  finally(_self, body) {
    return { body };
  },
  for(self, decl, cond, incr, body) {
    const label = self.setLabel(undefined);
    const oldScope = self.scope(true);
    try {
      doEval(self, decl);
      while (doEval(self, cond)) {
        try {
          doEval(self, body);
        } catch (e) {
          if (e[0] === MAGIC_EXIT && (e[2] === label || e[2] === undefined)) {
            switch (e[1]) {
              case 'continue':{
                  // Evaluate the incrementer, then continue the loop.
                  doEval(self, incr);
                  continue;
                }
              case 'break':{
                  // Exit the loop.
                  return;
                }}

          }
          throw e;
        }
        doEval(self, incr);
      }
    } finally {
      self.scope(oldScope);
    }
  },
  forOf(self, declOp, binding, expr, body) {
    const label = self.setLabel(undefined);
    const mutable = declOp !== 'const';
    const it = doEval(self, expr);
    const oldScope = self.scope(true);
    for (const val of it) {
      try {
        bindPattern(self, binding, mutable, val);
        try {
          doEval(self, body);
        } catch (e) {
          if (e[0] === MAGIC_EXIT && (e[2] === label || e[2] === undefined)) {
            switch (e[1]) {
              case 'continue':{
                  // Continue the loop.
                  continue;
                }
              case 'break':{
                  // Exit the loop.
                  return;
                }}

          }
          throw e;
        }
      } finally {
        self.scope(oldScope);
      }
    }
  },
  functionDecl(self, def, params, body) {
    const lambda = self.evaluators.lambda(self, params, body);
    const name = doEval(self, def);
    addBinding(self, name, true, lambda);
  },
  functionExpr(self, def, params, body) {
    const lambda = self.evaluators.lambda(self, params, body);
    if (def) {
      const name = doEval(self, def);
      addBinding(self, name, true, lambda);
    }
    return lambda;
  },
  index(self, pe, e) {
    // No restriction on index expressions, unlike Justin.
    const obj = doEval(self, pe);
    const index = doEval(self, e);
    return obj[index];
  },
  if(self, c, t, e) {
    const cval = doEval(self, c);
    if (cval) {
      doEval(self, t);
    } else if (e) {
      doEval(self, e);
    }
  },
  import(self, bind, path) {
    if (path[0] === '.' && path[1] === '/') {
      // Take the input relative to our current directory.
      path = `${self.dir}${path.slice(1)}`;
    }

    // Interpret with the same endowments.
    const ns = self.import(path);
    if (bind[0] === 'importBind') {
      bind[1].forEach(as => {
        if (as[0] !== 'as') {
          throw err(self)`Unrecognized import binding clause ${{ as }}`;
        }
        const val = as[1] === '*' ? ns : ns[as[1]];
        addBinding(self, as[2], false, val);
      });
    } else {
      throw err(self)`Unrecognized import binding ${{ bind }}`;
    }
  },
  label(self, label, stmt) {
    try {
      doEval(self, stmt, undefined, label);
    } catch (e) {
      if (e[0] === MAGIC_EXIT && e[2] === label) {
        if (e[1] === 'break') {
          return;
        }
        throw err(self)`Unrecognized exit type ${e[1]} for label ${{ label }}`;
      }
      // Some other magic exit, or a normal exception.
      throw e;
    }
  },
  lambda(self, bindings, body) {
    const parentScope = self.scope();
    const lambda = (...args) => {
      const oldScope = self.scope(parentScope);
      try {
        return doApply(self, args, bindings, body);
      } finally {
        self.scope(oldScope);
      }
    };
    return lambda;
  },
  let(self, binds) {
    binds.forEach(b => {
      const [pattern, val] = doEval(self, b);
      bindPattern(self, pattern, true, val);
    });
  },
  method(self, name, params, body) {
    const lambda = self.evaluators.lambda(self, params, body);
    return [name, lambda];
  },
  module(self, body) {
    const oldScope = self.scope();
    const result = {};
    try {
      for (const stmt of body) {
        if (stmt[0] === 'exportDefault') {
          // Handle this production explicitly.
          result.default = doEval(self, stmt[1]);
        } else if (stmt[0] === 'export') {
          const setter = (name, binding) => {
            oldScope[SCOPE_SET](name, binding);
            self.setComputedIndex(result, name, binding[BINDING_GET]());
          };
          self.scope([oldScope, oldScope[SCOPE_GET], setter]);
          const [declOp, binds] = stmt.slice(1);
          const mutable = declOp !== 'const';
          binds.forEach(bind => {
            const [pattern, val] = doEval(self, bind);
            bindPattern(self, pattern, mutable, val);
          });
        } else {
          doEval(self, stmt);
        }
      }
      return result;
    } finally {
      self.scope(oldScope);
    }
  },
  return(self, expr) {
    const val = doEval(self, expr);
    throw [MAGIC_EXIT, 'return', val];
  },
  switch(self, expr, clauses) {
    const val = doEval(self, expr);
    for (const clause of clauses) {
      evalSwitchClause(self, clause, val);
    }
  },
  throw(self, expr) {
    const val = doEval(self, expr);
    throw val;
  },
  try(self, b, c, f) {
    try {
      doEval(self, b);
    } catch (e) {
      if (e[0] === MAGIC_EXIT) {
        // Bypass the catchable exceptions.
        throw e;
      }
      if (c) {
        // Evaluate the `catch` block.
        const { bindings, body } = doEval(self, c);
        doApply(self, [e], bindings, body);
      }
    } finally {
      if (f) {
        // Evaluate the `finally` block.
        const { body } = doEval(self, f);
        doEval(self, body);
      }
    }
  },
  while(self, cond, body) {
    const label = self.setLabel(undefined);
    while (doEval(self, cond)) {
      try {
        doEval(self, body);
      } catch (e) {
        if (e[0] === MAGIC_EXIT && (e[2] === label || e[2] === undefined)) {
          switch (e[1]) {
            case 'continue':{
                // Continue the loop.
                continue;
              }
            case 'break':{
                // Exit the loop.
                return;
              }}

        }
        throw e;
      }
    }
  } });


export default jessieEvaluators;