import { insulate } from '@agoric/jessie'; import { makeMap } from '@agoric/jessie';
import { slog as $i_slog } from '@michaelfig/slog';const slog = insulate($i_slog);









export const BINDING_GET = 0;
export const BINDING_SET = 1;






export const SCOPE_PARENT = 0;
export const SCOPE_GET = 1;
export const SCOPE_SET = 2;



















const UNINITIALIZED = insulate({ toString() {return 'UNINITIALIZED';} });
export const addBinding = insulate((
self, name,
mutable, init = UNINITIALIZED) => {
  let slot, setter;
  if (mutable) {
    setter = val => slot = val;
  }
  if (init === UNINITIALIZED) {
    if (!mutable) {
      let allow = true;
      setter = val => {
        if (!allow) {
          throw err(self)`${{ name }} already initialized`;
        }
        allow = false;
        return slot = val;
      };
    }
  } else {
    slot = init;
  }
  const b = [() => slot, setter];
  return self.binding(name, b);
});

export const err = insulate(self => {
  slog.info`${self.uri} at ${self.pos()}`;
  return slog.error;
});

export const doEval = insulate((self, ast, overrideName, label) => {
  const [astName, ...args] = ast;
  const name = overrideName || astName;
  const ev = self.evaluators[name];
  const pos = ast._pegPosition;
  const oldPos = self.pos(pos);
  // Always reset the label to either undefined or the one the caller passed.
  self.setLabel(label);
  try {
    if (!ev) {
      throw err(self)`No ${{ name }} implementation`;
    }
    return ev(self, ...args);
  } finally {
    self.pos(oldPos);
  }
});

const makeInterp = insulate((
evaluators,
applyMethod,
importer,
setComputedIndex) => {
  function interp(ast, endowments, options) {
    const lastSlash = options.scriptName === undefined ? -1 : options.scriptName.lastIndexOf('/');
    const thisDir = lastSlash < 0 ? '.' : options.scriptName.slice(0, lastSlash);
    let scope,pos = '',label;

    const self = {
      applyMethod,
      dir: thisDir,
      evaluators,
      import(path) {
        const val = importer(path, iast => interp(iast, endowments, { scriptName: path }));
        slog.info(`imported ${path} as ${{ val }}`);
        return val;
      },
      setComputedIndex,
      binding(name, newBinding) {
        if (newBinding) {
          scope[SCOPE_SET](name, newBinding);
        } else {
          newBinding = scope[SCOPE_GET](name);
        }
        return newBinding;
      },
      pos(newPos) {
        const oldPos = pos;
        if (newPos) {
          pos = newPos;
        }
        return oldPos;
      },
      scope(newScope) {
        const oldScope = scope;
        if (newScope) {
          if (newScope === true) {
            const map = makeMap();
            newScope = [
            oldScope,
            (name) =>
            map.get(name) || oldScope && oldScope[SCOPE_GET](name),
            (name, binding) =>
            map.has(name) ? err(self)`Cannot redefine ${{ name }}` : map.set(name, binding)];

          }
          scope = newScope;
        }
        return oldScope;
      },
      setLabel(newLabel) {
        // This always removes the old label.
        const oldLabel = label;
        label = newLabel;
        return oldLabel;
      },
      uri: options.scriptName };


    // slog.info`AST: ${{ast}}`;
    self.scope(true);
    for (const [name, value] of Object.entries(endowments)) {
      // slog.info`Adding ${name}, ${value} to bindings`;
      addBinding(self, name, false, value);
    }
    return doEval(self, ast);
  }

  return interp;
});







export const getRef = insulate((self, astNode, mutable = true) => {
  const oldPos = self.pos();
  try {
    const pos = astNode._pegPosition;
    self.pos(pos);
    switch (astNode[0]) {
      case 'use':{
          const name = astNode[1];
          const b = self.binding(name);
          if (b) {
            return { getter: b[BINDING_GET], setter: b[BINDING_SET] };
          }
          throw err(self)`ReferenceError: ${{ name }} is not defined`;
        }

      case 'get':{
          const [objExpr, id] = astNode.slice(1);
          const obj = doEval(self, objExpr);
          return {
            getter: () => obj[id],
            setter: val => self.setComputedIndex(obj, id, val),
            thisObj: obj };

        }

      case 'def':{
          const name = astNode[1];
          const b = addBinding(self, name, mutable);
          return { getter: b[BINDING_GET], setter: b[BINDING_SET] };
        }

      default:{
          throw err(self)`Reference type ${{ type: astNode[0] }} not implemented`;
        }}

  } finally {
    self.pos(oldPos);
  }
});

export default makeInterp;