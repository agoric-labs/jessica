// DO NOT EDIT - Generated automatically from interp-jessie.mjs.ts by tessc
// TODO: Hoisting of functionDecls.

import $i_justinEvaluators from './interp-justin.mjs';const justinEvaluators = immunize($i_justinEvaluators);
import { addBinding as $i_addBinding, doEval as $i_doEval, err as $i_err, getRef as $i_getRef } from './interp-utils.mjs';const getRef = immunize($i_getRef);const err = immunize($i_err);const doEval = immunize($i_doEval);const addBinding = immunize($i_addBinding);

const MAGIC_EXIT = immunize({ toString: () => 'MAGIC_EXIT' });

const matchPropPattern = immunize((self, pattern, remaining) => {
  const pos = pattern._pegPosition;
  const oldPos = self.pos(pos);
  try {
    switch (pattern[0]) {
      case 'restObj':{
          // Convert remaining back to an object.
          const [, pat] = pattern;
          const obj = {};
          remaining.forEach((value, key) =>
          self.setComputedIndex(obj, key, value));
          return matchPattern(self, pat, obj);
        }
      case 'matchProp':{
          // Match a named key against a pattern.
          const [, key, pat] = pattern;
          const val = remaining.get(key);
          remaining.delete(key);
          return matchPattern(self, pat, val);
        }
      case 'optionalProp':{
          // Match a named key against a pattern, defaulting.
          const [, key, pat, dflt] = pattern;
          const val = remaining.has(key) ? remaining.get(key) : doEval(self, dflt);
          remaining.delete(key);
          return matchPattern(self, pat, val);
        }

      default:{
          err(self)`Cannot match property pattern ${{ pattern }}: not implemented`;
        }}

  } finally {
    self.pos(oldPos);
  }
});

const matchPattern = immunize((self, pattern, value) => {
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
            matchPattern(self, pat, value[i]).
            forEach(binding => prior.push(binding));
            return prior;
          }, []);
        }

      case 'matchRecord':{
          const remaining = makeMap(Object.entries(value));
          return pattern.slice(1).reduce((prior, pat) => {
            matchPropPattern(self, pat, remaining).
            forEach(binding => prior.push(binding));
            return prior;
          }, []);
        }

      default:{
          err(self)`Cannot match ${{ pattern }}: not implemented`;
        }}

  } finally {
    self.pos(oldPos);
  }
});

const bindPattern = immunize((self, pattern, mutable, value) => {
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

const evalSwitchClause = immunize((self, clause, val) => {
  switch (clause[0]) {
    case 'clause':{
        const [, guards, body] = clause;
        for (const guard of guards) {
          if (guard[0] === 'case') {
            const [, expr2] = guard;
            const val2 = doEval(self, expr2);
            if (val !== val2) {
              // Try the next case.
              continue;
            }
          } else if (guard[0] !== 'default') {
            err(self)`Unrecognized case expression ${{ guard }}`;
          }
          // Evaluate the body, which in Jessie will do a nonlocal exit.
          return doEval(self, body);
        }
        break;
      }

    default:{
        err(self)`Unrecognized switch clause ${{ clause }}`;
      }}

});

const doApply = immunize((self, args, bindings, body) => {
  const oldEnv = self.env();
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
          err(self)`Invalid function exit kind ${{ e: e[1] }}`;
        }
      }
      // Not a magic value, just throw normally.
      throw e;
    }
  } finally {
    self.env(oldEnv);
  }
});

const jessieEvaluators = immunize({
  ...justinEvaluators,
  '='(self, lValue, rValue) {
    const { setter } = getRef(self, lValue);
    const val = doEval(self, rValue);
    return setter(val);
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
          case 'break':
            return;
          case 'continue':
            err(self)`Cannot continue from block labelled ${{ label }}`;}

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
  finally(_self, body) {
    return { body };
  },
  for(self, decl, cond, incr, body) {
    const label = self.setLabel(undefined);
    const oldEnv = self.env();
    try {
      doEval(self, decl);
      while (doEval(self, cond)) {
        try {
          doEval(self, body);
        } catch (e) {
          if (e[0] === MAGIC_EXIT && (e[2] === label || e[2] === undefined)) {
            switch (e[1]) {
              case 'continue':
                // Evaluate the incrementer, then continue the loop.
                doEval(self, incr);
                continue;
              case 'break':
                // Exit the loop.
                return;}

          }
          throw e;
        }
        doEval(self, incr);
      }
    } finally {
      self.env(oldEnv);
    }
  },
  forOf(self, declOp, binding, expr, body) {
    const label = self.setLabel(undefined);
    const mutable = declOp !== 'const';
    const it = doEval(self, expr);
    const oldEnv = self.env();
    for (const val of it) {
      try {
        bindPattern(self, binding, mutable, val);
        try {
          doEval(self, body);
        } catch (e) {
          if (e[0] === MAGIC_EXIT && (e[2] === label || e[2] === undefined)) {
            switch (e[1]) {
              case 'continue':
                // Continue the loop.
                continue;
              case 'break':
                // Exit the loop.
                return;}

          }
          throw e;
        }
      } finally {
        self.env(oldEnv);
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
  import(self, def, path) {
    const { setter } = getRef(self, def, false);
    if (path[0] === '.' && path[1] === '/') {
      // Take the input relative to our current directory.
      path = `${self.dir}${path.slice(1)}`;
    }

    // Interpret with the same endowments.
    const val = self.import(path);
    setter(val);
  },
  label(self, label, stmt) {
    try {
      doEval(self, stmt, undefined, label);
    } catch (e) {
      if (e[0] === MAGIC_EXIT && e[2] === label) {
        switch (e[1]) {
          case 'break':
            return;}

        err(self)`Unrecognized exit type ${e[1]} for label ${{ label }}`;
      }
      // Some other magic exit, or a normal exception.
      throw e;
    }
  },
  lambda(self, bindings, body) {
    const parentEnv = self.env();
    const lambda = (...args) => {
      const oldEnv = self.env();
      try {
        self.env(parentEnv);
        return doApply(self, args, bindings, body);
      } finally {
        self.env(oldEnv);
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
  module(self, body) {
    const oldEnv = self.env();
    try {
      let didExport = false,exported;
      for (const stmt of body) {
        if (stmt[0] === 'exportDefault') {
          // Handle this production explicitly.
          if (didExport) {
            err(self)`Cannot use more than one "export default" statement`;
          }
          exported = doEval(self, stmt[1]);
          didExport = true;
        } else {
          doEval(self, stmt);
        }
      }
      return exported;
    } finally {
      self.env(oldEnv);
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
            case 'continue':
              // Continue the loop.
              continue;
            case 'break':
              // Exit the loop.
              return;}

        }
        throw e;
      }
    }
  } });


export default immunize(jessieEvaluators);