// DO NOT EDIT - Generated automatically from interp-utils.mjs.ts by tessc








export const BINDING_PARENT = 0;
export const BINDING_NAME = 1;
export const BINDING_GET = 2;
export const BINDING_SET = 3;




















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
  const b = [self.env(), name, () => slot, setter];
  return self.env(b);
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
    let envp,pos = '',label;

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
      env(newEnv) {
        if (newEnv) {
          envp = newEnv;
        }
        return envp;
      },
      pos(newPos) {
        const oldPos = pos;
        if (newPos) {
          pos = newPos;
        }
        return oldPos;
      },
      setLabel(newLabel) {
        // This always removes the old label.
        const oldLabel = label;
        label = newLabel;
        return oldLabel;
      },
      uri: options.scriptName };


    // slog.info`AST: ${{ast}}`;
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
          let b = self.env();
          const name = astNode[1];
          while (b !== undefined) {
            if (b[BINDING_NAME] === name) {
              return { getter: b[BINDING_GET], setter: b[BINDING_SET] };
            }
            b = b[BINDING_PARENT];
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

export default insulate(makeInterp);