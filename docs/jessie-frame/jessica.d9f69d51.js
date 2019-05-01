// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"Pi9h":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

// Adapted from SES/Caja - Copyright (C) 2011 Google Inc.
// Copyright (C) 2018 Agoric
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// based upon:
// https://github.com/google/caja/blob/master/src/com/google/caja/ses/startSES.js
// https://github.com/google/caja/blob/master/src/com/google/caja/ses/repairES5.js
// then copied from proposal-frozen-realms deep-freeze.js
// then copied from SES/src/bundle/deepFreeze.js
function makeHardener(initialFringe) {
  const {
    freeze,
    getOwnPropertyDescriptors,
    getPrototypeOf
  } = Object;
  const {
    ownKeys
  } = Reflect; // Objects that we won't freeze, either because we've frozen them already,
  // or they were one of the initial roots (terminals). These objects form
  // the "fringe" of the hardened object graph.

  const fringeSet = new WeakSet(initialFringe);

  function harden(root) {
    const toFreeze = new Set();
    const prototypes = new Map();
    const paths = new WeakMap(); // If val is something we should be freezing but aren't yet,
    // add it to toFreeze.

    function enqueue(val, path) {
      if (Object(val) !== val) {
        // ignore primitives
        return;
      }

      const type = typeof val;

      if (type !== 'object' && type !== 'function') {
        // future proof: break until someone figures out what it should do
        throw new TypeError(`Unexpected typeof: ${type}`);
      }

      if (fringeSet.has(val) || toFreeze.has(val)) {
        // Ignore if this is an exit, or we've already visited it
        return;
      } // console.log(`adding ${val} to toFreeze`, val);


      toFreeze.add(val);
      paths.set(val, path);
    }

    function freezeAndTraverse(obj) {
      // Immediately freeze the object to ensure reactive
      // objects such as proxies won't add properties
      // during traversal, before they get frozen.
      // Object are verified before being enqueued,
      // therefore this is a valid candidate.
      // Throws if this fails (strict mode).
      freeze(obj); // we rely upon certain commitments of Object.freeze and proxies here
      // get stable/immutable outbound links before a Proxy has a chance to do
      // something sneaky.

      const proto = getPrototypeOf(obj);
      const descs = getOwnPropertyDescriptors(obj);
      const path = paths.get(obj) || 'unknown'; // console.log(`adding ${proto} to prototypes under ${path}`);

      if (proto !== null && !prototypes.has(proto)) {
        prototypes.set(proto, path);
        paths.set(proto, `${path}.__proto__`);
      }

      ownKeys(descs).forEach(name => {
        const pathname = `${path}.${String(name)}`; // todo uncurried form
        // todo: getOwnPropertyDescriptors is guaranteed to return well-formed
        // descriptors, but they still inherit from Object.prototype. If
        // someone has poisoned Object.prototype to add 'value' or 'get'
        // properties, then a simple 'if ("value" in desc)' or 'desc.value'
        // test could be confused. We use hasOwnProperty to be sure about
        // whether 'value' is present or not, which tells us for sure that this
        // is a data property.

        const desc = descs[name];

        if ('value' in desc) {
          // todo uncurried form
          enqueue(desc.value, `${pathname}`);
        } else {
          enqueue(desc.get, `${pathname}(get)`);
          enqueue(desc.set, `${pathname}(set)`);
        }
      });
    }

    function dequeue() {
      // New values added before forEach() has finished will be visited.
      toFreeze.forEach(freezeAndTraverse); // todo curried forEach
    }

    function checkPrototypes() {
      prototypes.forEach((path, p) => {
        if (!(toFreeze.has(p) || fringeSet.has(p))) {
          // all reachable properties have already been frozen by this point
          throw new TypeError(`prototype ${p} of ${path} is not already in the fringeSet`);
        }
      });
    }

    function commit() {
      // todo curried forEach
      // we capture the real WeakSet.prototype.add above, in case someone
      // changes it. The two-argument form of forEach passes the second
      // argument as the 'this' binding, so we add to the correct set.
      toFreeze.forEach(fringeSet.add, fringeSet);
    }

    enqueue(root);
    dequeue(); // console.log("fringeSet", fringeSet);
    // console.log("prototype set:", prototypes);
    // console.log("toFreeze set:", toFreeze);

    checkPrototypes();
    commit();
    return root;
  }

  return harden;
}

var _default = makeHardener;
exports.default = _default;
},{}],"IVhz":[function(require,module,exports) {

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],"boWn":[function(require,module,exports) {
var indexOf = require('indexof');

var Object_keys = function (obj) {
    if (Object.keys) return Object.keys(obj)
    else {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    }
};

var forEach = function (xs, fn) {
    if (xs.forEach) return xs.forEach(fn)
    else for (var i = 0; i < xs.length; i++) {
        fn(xs[i], i, xs);
    }
};

var defineProp = (function() {
    try {
        Object.defineProperty({}, '_', {});
        return function(obj, name, value) {
            Object.defineProperty(obj, name, {
                writable: true,
                enumerable: false,
                configurable: true,
                value: value
            })
        };
    } catch(e) {
        return function(obj, name, value) {
            obj[name] = value;
        };
    }
}());

var globals = ['Array', 'Boolean', 'Date', 'Error', 'EvalError', 'Function',
'Infinity', 'JSON', 'Math', 'NaN', 'Number', 'Object', 'RangeError',
'ReferenceError', 'RegExp', 'String', 'SyntaxError', 'TypeError', 'URIError',
'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape',
'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'undefined', 'unescape'];

function Context() {}
Context.prototype = {};

var Script = exports.Script = function NodeScript (code) {
    if (!(this instanceof Script)) return new Script(code);
    this.code = code;
};

Script.prototype.runInContext = function (context) {
    if (!(context instanceof Context)) {
        throw new TypeError("needs a 'context' argument.");
    }
    
    var iframe = document.createElement('iframe');
    if (!iframe.style) iframe.style = {};
    iframe.style.display = 'none';
    
    document.body.appendChild(iframe);
    
    var win = iframe.contentWindow;
    var wEval = win.eval, wExecScript = win.execScript;

    if (!wEval && wExecScript) {
        // win.eval() magically appears when this is called in IE:
        wExecScript.call(win, 'null');
        wEval = win.eval;
    }
    
    forEach(Object_keys(context), function (key) {
        win[key] = context[key];
    });
    forEach(globals, function (key) {
        if (context[key]) {
            win[key] = context[key];
        }
    });
    
    var winKeys = Object_keys(win);

    var res = wEval.call(win, this.code);
    
    forEach(Object_keys(win), function (key) {
        // Avoid copying circular objects like `top` and `window` by only
        // updating existing context properties or new properties in the `win`
        // that was only introduced after the eval.
        if (key in context || indexOf(winKeys, key) === -1) {
            context[key] = win[key];
        }
    });

    forEach(globals, function (key) {
        if (!(key in context)) {
            defineProp(context, key, win[key]);
        }
    });
    
    document.body.removeChild(iframe);
    
    return res;
};

Script.prototype.runInThisContext = function () {
    return eval(this.code); // maybe...
};

Script.prototype.runInNewContext = function (context) {
    var ctx = Script.createContext(context);
    var res = this.runInContext(ctx);

    forEach(Object_keys(ctx), function (key) {
        context[key] = ctx[key];
    });

    return res;
};

forEach(Object_keys(Script.prototype), function (name) {
    exports[name] = Script[name] = function (code) {
        var s = Script(code);
        return s[name].apply(s, [].slice.call(arguments, 1));
    };
});

exports.createScript = function (code) {
    return exports.Script(code);
};

exports.createContext = Script.createContext = function (context) {
    var copy = new Context();
    if(typeof context === 'object') {
        forEach(Object_keys(context), function (key) {
            copy[key] = context[key];
        });
    }
    return copy;
};

},{"indexof":"IVhz"}],"iDNi":[function(require,module,exports) {

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _makeHardener = _interopRequireDefault(require("@agoric/make-hardener"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// we'd like to abandon, but we can't, so just scream and break a lot of
// stuff. However, since we aren't really aborting the process, be careful to
// not throw an Error object which could be captured by child-Realm code and
// used to access the (too-powerful) primal-realm Error object.
function throwTantrum(s, err = undefined) {
  const msg = `please report internal shim error: ${s}`; // we want to log these 'should never happen' things.
  // eslint-disable-next-line no-console

  console.error(msg);

  if (err) {
    // eslint-disable-next-line no-console
    console.error(`${err}`); // eslint-disable-next-line no-console

    console.error(`${err.stack}`);
  } // eslint-disable-next-line no-debugger


  debugger;
  throw msg;
}

function assert(condition, message) {
  if (!condition) {
    throwTantrum(message);
  }
} // Remove code modifications.


function cleanupSource(src) {
  /* START_TESTS_ONLY */
  // Restore eval which is modified by esm module.
  src = src.replace(/\(0,[^)]+\)/g, '(0, eval)'); // Remove code coverage which is injected by nyc module.

  src = src.replace(/cov_[^+]+\+\+[;,]/g, '');
  /* END_TESTS_ONLY */

  return src;
} // buildChildRealm is immediately turned into a string, and this function is
// never referenced again, because it closes over the wrong intrinsics


function buildChildRealm(unsafeRec, BaseRealm) {
  const {
    initRootRealm,
    initCompartment,
    getRealmGlobal,
    realmEvaluate
  } = BaseRealm; // This Object and Reflect are brand new, from a new unsafeRec, so no user
  // code has been run or had a chance to manipulate them. We extract these
  // properties for brevity, not for security. Don't ever run this function
  // *after* user code has had a chance to pollute its environment, or it
  // could be used to gain access to BaseRealm and primal-realm Error
  // objects.

  const {
    create,
    defineProperties
  } = Object;
  const errorConstructors = new Map([['EvalError', EvalError], ['RangeError', RangeError], ['ReferenceError', ReferenceError], ['SyntaxError', SyntaxError], ['TypeError', TypeError], ['URIError', URIError]]); // Like Realm.apply except that it catches anything thrown and rethrows it
  // as an Error from this realm

  function callAndWrapError(target, ...args) {
    try {
      return target(...args);
    } catch (err) {
      if (Object(err) !== err) {
        // err is a primitive value, which is safe to rethrow
        throw err;
      }

      let eName, eMessage, eStack;

      try {
        // The child environment might seek to use 'err' to reach the
        // parent's intrinsics and corrupt them. `${err.name}` will cause
        // string coercion of 'err.name'. If err.name is an object (probably
        // a String of the parent Realm), the coercion uses
        // err.name.toString(), which is under the control of the parent. If
        // err.name were a primitive (e.g. a number), it would use
        // Number.toString(err.name), using the child's version of Number
        // (which the child could modify to capture its argument for later
        // use), however primitives don't have properties like .prototype so
        // they aren't useful for an attack.
        eName = `${err.name}`;
        eMessage = `${err.message}`;
        eStack = `${err.stack || eMessage}`; // eName/eMessage/eStack are now child-realm primitive strings, and
        // safe to expose
      } catch (ignored) {
        // if err.name.toString() throws, keep the (parent realm) Error away
        // from the child
        throw new Error('unknown error');
      }

      const ErrorConstructor = errorConstructors.get(eName) || Error;

      try {
        throw new ErrorConstructor(eMessage);
      } catch (err2) {
        err2.stack = eStack; // replace with the captured inner stack

        throw err2;
      }
    }
  }

  class Realm {
    constructor() {
      // The Realm constructor is not intended to be used with the new operator
      // or to be subclassed. It may be used as the value of an extends clause
      // of a class definition but a super call to the Realm constructor will
      // cause an exception.
      // When Realm is called as a function, an exception is also raised because
      // a class constructor cannot be invoked without 'new'.
      throw new TypeError('Realm is not a constructor');
    }

    static makeRootRealm(options) {
      // This is the exposed interface.
      options = Object(options); // todo: sanitize
      // Bypass the constructor.

      const r = create(Realm.prototype);
      callAndWrapError(initRootRealm, unsafeRec, r, options);
      return r;
    }

    static makeCompartment() {
      // Bypass the constructor.
      const r = create(Realm.prototype);
      callAndWrapError(initCompartment, unsafeRec, r);
      return r;
    } // we omit the constructor because it is empty. All the personalization
    // takes place in one of the two static methods,
    // makeRootRealm/makeCompartment


    get global() {
      // this is safe against being called with strange 'this' because
      // baseGetGlobal immediately does a trademark check (it fails unless
      // this 'this' is present in a weakmap that is only populated with
      // legitimate Realm instances)
      return callAndWrapError(getRealmGlobal, this);
    }

    evaluate(x, endowments) {
      // safe against strange 'this', as above
      return callAndWrapError(realmEvaluate, this, x, endowments);
    }

  }

  defineProperties(Realm, {
    toString: {
      value: () => 'function Realm() { [shim code] }',
      writable: false,
      enumerable: false,
      configurable: true
    }
  });
  defineProperties(Realm.prototype, {
    toString: {
      value: () => '[object Realm]',
      writable: false,
      enumerable: false,
      configurable: true
    }
  });
  return Realm;
} // The parentheses means we don't bind the 'buildChildRealm' name inside the
// child's namespace. this would accept an anonymous function declaration.
// function expression (not a declaration) so it has a completion value.


const buildChildRealmString = cleanupSource(`'use strict'; (${buildChildRealm})`);

function createRealmFacade(unsafeRec, BaseRealm) {
  const {
    unsafeEval
  } = unsafeRec; // The BaseRealm is the Realm class created by
  // the shim. It's only valid for the context where
  // it was parsed.
  // The Realm facade is a lightweight class built in the
  // context a different context, that provide a fully
  // functional Realm class using the intrisics
  // of that context.
  // This process is simplified because all methods
  // and properties on a realm instance already return
  // values using the intrinsics of the realm's context.
  // Invoke the BaseRealm constructor with Realm as the prototype.

  return unsafeEval(buildChildRealmString)(unsafeRec, BaseRealm);
} // Declare shorthand functions. Sharing these declarations across modules
// improves both consistency and minification. Unused declarations are
// dropped by the tree shaking process.
// we capture these, not just for brevity, but for security. If any code
// modifies Object to change what 'assign' points to, the Realm shim would be
// corrupted.


const {
  assign,
  create,
  freeze,
  defineProperties,
  // Object.defineProperty is allowed to fail silentlty, use Object.defineProperties instead.
  getOwnPropertyDescriptor,
  getOwnPropertyDescriptors,
  getOwnPropertyNames,
  getPrototypeOf,
  setPrototypeOf
} = Object;
const {
  apply,
  ownKeys // Reflect.ownKeys includes Symbols and unenumerables, unlike Object.keys()

} = Reflect;
/**
 * uncurryThis()
 * See http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
 * which only lives at http://web.archive.org/web/20160805225710/http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
 *
 * Performance:
 * 1. The native call is about 10x faster on FF than chrome
 * 2. The version using Function.bind() is about 100x slower on FF, equal on chrome, 2x slower on Safari
 * 3. The version using a spread and Reflect.apply() is about 10x slower on FF, equal on chrome, 2x slower on Safari
 *
 * const bind = Function.prototype.bind;
 * const uncurryThis = bind.bind(bind.call);
 */

const uncurryThis = fn => (thisArg, ...args) => apply(fn, thisArg, args); // We also capture these for security: changes to Array.prototype after the
// Realm shim runs shouldn't affect subsequent Realm operations.


const objectHasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty),
      arrayFilter = uncurryThis(Array.prototype.filter),
      arrayPop = uncurryThis(Array.prototype.pop),
      arrayJoin = uncurryThis(Array.prototype.join),
      arrayConcat = uncurryThis(Array.prototype.concat),
      regexpTest = uncurryThis(RegExp.prototype.test),
      stringIncludes = uncurryThis(String.prototype.includes); // All the following stdlib items have the same name on both our intrinsics
// object and on the global object. Unlike Infinity/NaN/undefined, these
// should all be writable and configurable.

const sharedGlobalPropertyNames = [// *** 18.2 Function Properties of the Global Object
// 'eval', // comes from safeEval instead
'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', // *** 18.3 Constructor Properties of the Global Object
'Array', 'ArrayBuffer', 'Boolean', 'DataView', 'Date', 'Error', 'EvalError', 'Float32Array', 'Float64Array', // 'Function', // comes from safeFunction instead
'Int8Array', 'Int16Array', 'Int32Array', 'Map', 'Number', 'Object', 'Promise', 'Proxy', 'RangeError', 'ReferenceError', 'RegExp', 'Set', // 'SharedArrayBuffer' // removed on Jan 5, 2018
'String', 'Symbol', 'SyntaxError', 'TypeError', 'Uint8Array', 'Uint8ClampedArray', 'Uint16Array', 'Uint32Array', 'URIError', 'WeakMap', 'WeakSet', // *** 18.4 Other Properties of the Global Object
// 'Atomics', // removed on Jan 5, 2018
'JSON', 'Math', 'Reflect', // *** Annex B
'escape', 'unescape', // *** ECMA-402
'Intl' // *** ESNext
// 'Realm' // Comes from createRealmGlobalObject()
];

function getSharedGlobalDescs(unsafeGlobal) {
  const descriptors = {
    // *** 18.1 Value Properties of the Global Object
    Infinity: {
      value: Infinity
    },
    NaN: {
      value: NaN
    },
    undefined: {
      value: undefined
    }
  };

  for (const name of sharedGlobalPropertyNames) {
    const desc = getOwnPropertyDescriptor(unsafeGlobal, name);

    if (desc) {
      // Abort if an accessor is found on the unsafe global object instead of a
      // data property. We should never get into this non standard situation.
      assert('value' in desc, `unexpected accessor on global property: ${name}`);
      descriptors[name] = {
        value: desc.value,
        writable: true,
        configurable: true
      };
    }
  }

  return descriptors;
} // Adapted from SES/Caja - Copyright (C) 2011 Google Inc.
// https://github.com/google/caja/blob/master/src/com/google/caja/ses/startSES.js
// https://github.com/google/caja/blob/master/src/com/google/caja/ses/repairES5.js

/**
 * Replace the legacy accessors of Object to comply with strict mode
 * and ES2016 semantics, we do this by redefining them while in 'use strict'.
 *
 * todo: list the issues resolved
 *
 * This function can be used in two ways: (1) invoked directly to fix the primal
 * realm's Object.prototype, and (2) converted to a string to be executed
 * inside each new RootRealm to fix their Object.prototypes. Evaluation requires
 * the function to have no dependencies, so don't import anything from the outside.
 */
// todo: this file should be moved out to a separate repo and npm module.


function repairAccessors() {
  const {
    defineProperty,
    defineProperties,
    getOwnPropertyDescriptor,
    getPrototypeOf,
    prototype: objectPrototype
  } = Object; // On some platforms, the implementation of these functions act as if they are
  // in sloppy mode: if they're invoked badly, they will expose the global object,
  // so we need to repair these for security. Thus it is our responsibility to fix
  // this, and we need to include repairAccessors. E.g. Chrome in 2016.

  try {
    // Verify that the method is not callable.
    // eslint-disable-next-line no-restricted-properties, no-underscore-dangle
    (0, objectPrototype.__lookupGetter__)('x');
  } catch (ignore) {
    // Throws, no need to patch.
    return;
  }

  function toObject(obj) {
    if (obj === undefined || obj === null) {
      throw new TypeError(`can't convert undefined or null to object`);
    }

    return Object(obj);
  }

  function asPropertyName(obj) {
    if (typeof obj === 'symbol') {
      return obj;
    }

    return `${obj}`;
  }

  function aFunction(obj, accessor) {
    if (typeof obj !== 'function') {
      throw TypeError(`invalid ${accessor} usage`);
    }

    return obj;
  }

  defineProperties(objectPrototype, {
    __defineGetter__: {
      value: function __defineGetter__(prop, func) {
        const O = toObject(this);
        defineProperty(O, prop, {
          get: aFunction(func, 'getter'),
          enumerable: true,
          configurable: true
        });
      }
    },
    __defineSetter__: {
      value: function __defineSetter__(prop, func) {
        const O = toObject(this);
        defineProperty(O, prop, {
          set: aFunction(func, 'setter'),
          enumerable: true,
          configurable: true
        });
      }
    },
    __lookupGetter__: {
      value: function __lookupGetter__(prop) {
        let O = toObject(this);
        prop = asPropertyName(prop);
        let desc;

        while (O && !(desc = getOwnPropertyDescriptor(O, prop))) {
          O = getPrototypeOf(O);
        }

        return desc && desc.get;
      }
    },
    __lookupSetter__: {
      value: function __lookupSetter__(prop) {
        let O = toObject(this);
        prop = asPropertyName(prop);
        let desc;

        while (O && !(desc = getOwnPropertyDescriptor(O, prop))) {
          O = getPrototypeOf(O);
        }

        return desc && desc.set;
      }
    }
  });
} // Adapted from SES/Caja
// Copyright (C) 2011 Google Inc.
// https://github.com/google/caja/blob/master/src/com/google/caja/ses/startSES.js
// https://github.com/google/caja/blob/master/src/com/google/caja/ses/repairES5.js

/**
 * This block replaces the original Function constructor, and the original
 * %GeneratorFunction% %AsyncFunction% and %AsyncGeneratorFunction%, with
 * safe replacements that throw if invoked.
 *
 * These are all reachable via syntax, so it isn't sufficient to just
 * replace global properties with safe versions. Our main goal is to prevent
 * access to the Function constructor through these starting points.

 * After this block is done, the originals must no longer be reachable, unless
 * a copy has been made, and funtions can only be created by syntax (using eval)
 * or by invoking a previously saved reference to the originals.
 */
// todo: this file should be moved out to a separate repo and npm module.


function repairFunctions() {
  const {
    defineProperties,
    getPrototypeOf,
    setPrototypeOf
  } = Object;
  /**
   * The process to repair constructors:
   * 1. Create an instance of the function by evaluating syntax
   * 2. Obtain the prototype from the instance
   * 3. Create a substitute tamed constructor
   * 4. Replace the original constructor with the tamed constructor
   * 5. Replace tamed constructor prototype property with the original one
   * 6. Replace its [[Prototype]] slot with the tamed constructor of Function
   */

  function repairFunction(name, declaration) {
    let FunctionInstance;

    try {
      // eslint-disable-next-line no-new-func
      FunctionInstance = (0, eval)(declaration);
    } catch (e) {
      if (e instanceof SyntaxError) {
        // Prevent failure on platforms where async and/or generators are not supported.
        return;
      } // Re-throw


      throw e;
    }

    const FunctionPrototype = getPrototypeOf(FunctionInstance); // Prevents the evaluation of source when calling constructor on the
    // prototype of functions.

    const TamedFunction = function () {
      throw new TypeError('Not available');
    };

    defineProperties(TamedFunction, {
      name: {
        value: name
      }
    }); // (new Error()).constructors does not inherit from Function, because Error
    // was defined before ES6 classes. So we don't need to repair it too.
    // (Error()).constructor inherit from Function, which gets a tamed constructor here.
    // todo: in an ES6 class that does not inherit from anything, what does its
    // constructor inherit from? We worry that it inherits from Function, in
    // which case instances could give access to unsafeFunction. markm says
    // we're fine: the constructor inherits from Object.prototype
    // This line replaces the original constructor in the prototype chain
    // with the tamed one. No copy of the original is peserved.

    defineProperties(FunctionPrototype, {
      constructor: {
        value: TamedFunction
      }
    }); // This line sets the tamed constructor's prototype data property to
    // the original one.

    defineProperties(TamedFunction, {
      prototype: {
        value: FunctionPrototype
      }
    });

    if (TamedFunction !== Function.prototype.constructor) {
      // Ensures that all functions meet "instanceof Function" in a realm.
      setPrototypeOf(TamedFunction, Function.prototype.constructor);
    }
  } // Here, the order of operation is important: Function needs to be repaired
  // first since the other repaired constructors need to inherit from the tamed
  // Function function constructor.
  // note: this really wants to be part of the standard, because new
  // constructors may be added in the future, reachable from syntax, and this
  // list must be updated to match.
  // "plain arrow functions" inherit from Function.prototype


  repairFunction('Function', '(function(){})');
  repairFunction('GeneratorFunction', '(function*(){})');
  repairFunction('AsyncFunction', '(async function(){})');
  repairFunction('AsyncGeneratorFunction', '(async function*(){})');
} // this module must never be importable outside the Realm shim itself
// A "context" is a fresh unsafe Realm as given to us by existing platforms.
// We need this to implement the shim. However, when Realms land for real,
// this feature will be provided by the underlying engine instead.
// note: in a node module, the top-level 'this' is not the global object
// (it's *something* but we aren't sure what), however an indirect eval of
// 'this' will be the correct global object.


const unsafeGlobalSrc = "'use strict'; this";
const unsafeGlobalEvalSrc = `(0, eval)("'use strict'; this")`; // This method is only exported for testing purposes.

function createNewUnsafeGlobalForNode() {
  // Note that webpack and others will shim 'vm' including the method 'runInNewContext',
  // so the presence of vm is not a useful check
  // TODO: Find a better test that works with bundlers
  // eslint-disable-next-line no-new-func
  const isNode = new Function('try {return this===global}catch(e){ return false}')();

  if (!isNode) {
    return undefined;
  } // eslint-disable-next-line global-require


  const vm = require('vm'); // Use unsafeGlobalEvalSrc to ensure we get the right 'this'.


  const unsafeGlobal = vm.runInNewContext(unsafeGlobalEvalSrc);
  return unsafeGlobal;
} // This method is only exported for testing purposes.


function createNewUnsafeGlobalForBrowser() {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  const unsafeGlobal = iframe.contentWindow.eval(unsafeGlobalSrc); // We keep the iframe attached to the DOM because removing it
  // causes its global object to lose intrinsics, its eval()
  // function to evaluate code, etc.
  // TODO: can we remove and garbage-collect the iframes?

  return unsafeGlobal;
}

const getNewUnsafeGlobal = () => {
  const newUnsafeGlobalForBrowser = createNewUnsafeGlobalForBrowser();
  const newUnsafeGlobalForNode = createNewUnsafeGlobalForNode();

  if (!newUnsafeGlobalForBrowser && !newUnsafeGlobalForNode || newUnsafeGlobalForBrowser && newUnsafeGlobalForNode) {
    throw new Error('unexpected platform, unable to create Realm');
  }

  return newUnsafeGlobalForBrowser || newUnsafeGlobalForNode;
}; // The unsafeRec is shim-specific. It acts as the mechanism to obtain a fresh
// set of intrinsics together with their associated eval and Function
// evaluators. These must be used as a matched set, since the evaluators are
// tied to a set of intrinsics, aka the "undeniables". If it were possible to
// mix-and-match them from different contexts, that would enable some
// attacks.


function createUnsafeRec(unsafeGlobal, allShims = []) {
  const sharedGlobalDescs = getSharedGlobalDescs(unsafeGlobal);
  return freeze({
    unsafeGlobal,
    sharedGlobalDescs,
    unsafeEval: unsafeGlobal.eval,
    unsafeFunction: unsafeGlobal.Function,
    allShims
  });
}

const repairAccessorsShim = cleanupSource(`"use strict"; (${repairAccessors})();`);
const repairFunctionsShim = cleanupSource(`"use strict"; (${repairFunctions})();`); // Create a new unsafeRec from a brand new context, with new intrinsics and a
// new global object

function createNewUnsafeRec(allShims) {
  const unsafeGlobal = getNewUnsafeGlobal();
  unsafeGlobal.eval(repairAccessorsShim);
  unsafeGlobal.eval(repairFunctionsShim);
  return createUnsafeRec(unsafeGlobal, allShims);
} // Create a new unsafeRec from the current context, where the Realm shim is
// being parsed and executed, aka the "Primal Realm"


function createCurrentUnsafeRec() {
  const unsafeGlobal = (0, eval)(unsafeGlobalSrc);
  repairAccessors();
  repairFunctions();
  return createUnsafeRec(unsafeGlobal);
} // todo: think about how this interacts with endowments, check for conflicts
// between the names being optimized and the ones added by endowments

/**
 * Simplified validation of indentifier names: may only contain alphanumeric
 * characters (or "$" or "_"), and may not start with a digit. This is safe
 * and does not reduces the compatibility of the shim. The motivation for
 * this limitation was to decrease the complexity of the implementation,
 * and to maintain a resonable level of performance.
 * Note: \w is equivalent [a-zA-Z_0-9]
 * See 11.6.1 Identifier Names
 */


const identifierPattern = /^[a-zA-Z_$][\w$]*$/;
/**
 * In JavaScript you cannot use these reserved words as variables.
 * See 11.6.1 Identifier Names
 */

const keywords = new Set([// 11.6.2.1 Keywords
'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', // Also reserved when parsing strict mode code
'let', 'static', // 11.6.2.2 Future Reserved Words
'enum', // Also reserved when parsing strict mode code
'implements', 'package', 'protected', 'interface', 'private', 'public', // Reserved but not mentioned in specs
'await', 'null', 'true', 'false', 'this', 'arguments']);
/**
 * getOptimizableGlobals()
 * What variable names might it bring into scope? These include all
 * property names which can be variable names, including the names
 * of inherited properties. It excludes symbols and names which are
 * keywords. We drop symbols safely. Currently, this shim refuses
 * service if any of the names are keywords or keyword-like. This is
 * safe and only prevent performance optimization.
 */

function getOptimizableGlobals(safeGlobal) {
  const descs = getOwnPropertyDescriptors(safeGlobal); // getOwnPropertyNames does ignore Symbols so we don't need this extra check:
  // typeof name === 'string' &&

  const constants = arrayFilter(getOwnPropertyNames(descs), name => {
    // Ensure we have a valid identifier. We use regexpTest rather than
    // /../.test() to guard against the case where RegExp has been poisoned.
    if (name === 'eval' || keywords.has(name) || !regexpTest(identifierPattern, name)) {
      return false;
    }

    const desc = descs[name];
    return (//
      // The getters will not have .writable, don't let the falsyness of
      // 'undefined' trick us: test with === false, not ! . However descriptors
      // inherit from the (potentially poisoned) global object, so we might see
      // extra properties which weren't really there. Accessor properties have
      // 'get/set/enumerable/configurable', while data properties have
      // 'value/writable/enumerable/configurable'.
      desc.configurable === false && desc.writable === false && //
      // Checks for data properties because they're the only ones we can
      // optimize (accessors are most likely non-constant). Descriptors can't
      // can't have accessors and value properties at the same time, therefore
      // this check is sufficient. Using explicit own property deal with the
      // case where Object.prototype has been poisoned.
      objectHasOwnProperty(desc, 'value')
    );
  });
  return constants;
}
/**
 * alwaysThrowHandler is a proxy handler which throws on any trap called.
 * It's made from a proxy with a get trap that throws. Its target is
 * an immutable (frozen) object and is safe to share.
 */


const alwaysThrowHandler = new Proxy(freeze({}), {
  get(target, prop) {
    throwTantrum(`unexpected scope handler trap called: ${prop}`);
  }

});
/**
 * ScopeHandler manages a Proxy which serves as the global scope for the
 * safeEvaluator operation (the Proxy is the argument of a 'with' binding).
 * As described in createSafeEvaluator(), it has several functions:
 * - allow the very first (and only the very first) use of 'eval' to map to
 *   the real (unsafe) eval function, so it acts as a 'direct eval' and can
 *    access its lexical scope (which maps to the 'with' binding, which the
 *   ScopeHandler also controls).
 * - ensure that all subsequent uses of 'eval' map to the safeEvaluator,
 *   which lives as the 'eval' property of the safeGlobal.
 * - route all other property lookups at the safeGlobal.
 * - hide the unsafeGlobal which lives on the scope chain above the 'with'.
 * - ensure the Proxy invariants despite some global properties being frozen.
 */

function createScopeHandler(unsafeRec) {
  const {
    unsafeGlobal,
    unsafeEval
  } = unsafeRec; // This flag allow us to determine if the eval() call is an done by the
  // realm's code or if it is user-land invocation, so we can react differently.

  let useUnsafeEvaluator = false;
  return {
    // The scope handler throws if any trap other than get/set/has are run
    // (e.g. getOwnPropertyDescriptors, apply, getPrototypeOf).
    // eslint-disable-next-line no-proto
    __proto__: alwaysThrowHandler,

    allowUnsafeEvaluatorOnce() {
      useUnsafeEvaluator = true;
    },

    unsafeEvaluatorAllowed() {
      return useUnsafeEvaluator;
    },

    get(target, prop) {
      // Special treatment for eval. The very first lookup of 'eval' gets the
      // unsafe (real direct) eval, so it will get the lexical scope that uses
      // the 'with' context.
      if (prop === 'eval') {
        // test that it is true rather than merely truthy
        if (useUnsafeEvaluator === true) {
          // revoke before use
          useUnsafeEvaluator = false;
          return unsafeEval;
        }

        return target.eval;
      } // todo: shim integrity, capture Symbol.unscopables


      if (prop === Symbol.unscopables) {
        // Safe to return a primal realm Object here because the only code that
        // can do a get() on a non-string is the internals of with() itself,
        // and the only thing it does is to look for properties on it. User
        // code cannot do a lookup on non-strings.
        return undefined;
      } // Properties of the global.


      if (prop in target) {
        return target[prop];
      } // Prevent the lookup for other properties.


      return undefined;
    },

    // eslint-disable-next-line class-methods-use-this
    set(target, prop, value) {
      // todo: allow modifications when target.hasOwnProperty(prop) and it
      // is writable, assuming we've already rejected overlap (see
      // createSafeEvaluatorFactory.factory). This TypeError gets replaced with
      // target[prop] = value
      if (objectHasOwnProperty(target, prop)) {
        // todo: shim integrity: TypeError, String
        throw new TypeError(`do not modify endowments like ${String(prop)}`);
      } // todo (optimization): keep a reference to the shadow avoids calling
      // getPrototypeOf on the target every time the set trap is invoked,
      // since safeGlobal === getPrototypeOf(target).


      getPrototypeOf(target)[prop] = value; // Return true after successful set.

      return true;
    },

    // we need has() to return false for some names to prevent the lookup  from
    // climbing the scope chain and eventually reaching the unsafeGlobal
    // object, which is bad.
    // note: unscopables! every string in Object[Symbol.unscopables]
    // todo: we'd like to just have has() return true for everything, and then
    // use get() to raise a ReferenceError for anything not on the safe global.
    // But we want to be compatible with ReferenceError in the normal case and
    // the lack of ReferenceError in the 'typeof' case. Must either reliably
    // distinguish these two cases (the trap behavior might be different), or
    // we rely on a mandatory source-to-source transform to change 'typeof abc'
    // to XXX. We already need a mandatory parse to prevent the 'import',
    // since it's a special form instead of merely being a global variable/
    // note: if we make has() return true always, then we must implement a
    // set() trap to avoid subverting the protection of strict mode (it would
    // accept assignments to undefined globals, when it ought to throw
    // ReferenceError for such assignments)
    has(target, prop) {
      // proxies stringify 'prop', so no TOCTTOU danger here
      // unsafeGlobal: hide all properties of unsafeGlobal at the expense of 'typeof'
      // being wrong for those properties. For example, in the browser, evaluating
      // 'document = 3', will add a property to  safeGlobal instead of throwing a
      // ReferenceError.
      if (prop === 'eval' || prop in target || prop in unsafeGlobal) {
        return true;
      }

      return false;
    }

  };
} // this \s *must* match all kinds of syntax-defined whitespace. If e.g.
// U+2028 (LINE SEPARATOR) or U+2029 (PARAGRAPH SEPARATOR) is treated as
// whitespace by the parser, but not matched by /\s/, then this would admit
// an attack like: import\u2028('power.js') . We're trying to distinguish
// something like that from something like importnotreally('power.js') which
// is perfectly safe.


const importParser = /^(.*)\bimport\s*(\(|\/\/|\/\*)/m;

function rejectImportExpressions(s) {
  const matches = importParser.exec(s);

  if (matches) {
    // todo: if we have a full parser available, use it here. If there is no
    // 'import' token in the string, we're safe.
    // if (!parse(s).contains('import')) return;
    const linenum = matches[1].split('\n').length; // more or less

    throw new SyntaxError(`possible import expression rejected around line ${linenum}`);
  }
} // Portions adapted from V8 - Copyright 2016 the V8 project authors.


function buildOptimizer(constants) {
  // No need to build an oprimizer when there are no constants.
  if (constants.length === 0) return ''; // Use 'this' to avoid going through the scope proxy, which is unecessary
  // since the optimizer only needs references to the safe global.

  return `const {${arrayJoin(constants, ',')}} = this;`;
}

function createScopedEvaluatorFactory(unsafeRec, constants) {
  const {
    unsafeFunction
  } = unsafeRec;
  const optimizer = buildOptimizer(constants); // Create a function in sloppy mode, so that we can use 'with'. It returns
  // a function in strict mode that evaluates the provided code using direct
  // eval, and thus in strict mode in the same scope. We must be very careful
  // to not create new names in this scope
  // 1: we use 'with' (around a Proxy) to catch all free variable names. The
  // first 'arguments[0]' holds the Proxy which safely wraps the safeGlobal
  // 2: 'optimizer' catches common variable names for speed
  // 3: The inner strict function is effectively passed two parameters:
  //    a) its arguments[0] is the source to be directly evaluated.
  //    b) its 'this' is the this binding seen by the code being directly evaluated.
  // everything in the 'optimizer' string is looked up in the proxy
  // (including an 'arguments[0]', which points at the Proxy). 'function' is
  // a keyword, not a variable, so it is not looked up. then 'eval' is looked
  // up in the proxy, that's the first time it is looked up after
  // useUnsafeEvaluator is turned on, so the proxy returns the real the
  // unsafeEval, which satisfies the IsDirectEvalTrap predicate, so it uses
  // the direct eval and gets the lexical scope. The second 'arguments[0]' is
  // looked up in the context of the inner function. The *contents* of
  // arguments[0], because we're using direct eval, are looked up in the
  // Proxy, by which point the useUnsafeEvaluator switch has been flipped
  // back to 'false', so any instances of 'eval' in that string will get the
  // safe evaluator.

  return unsafeFunction(`
    with (arguments[0]) {
      ${optimizer}
      return function() {
        'use strict';
        return eval(arguments[0]);
      };
    }
  `);
}

function createSafeEvaluatorFactory(unsafeRec, safeGlobal) {
  const {
    unsafeFunction
  } = unsafeRec;
  const scopeHandler = createScopeHandler(unsafeRec);
  const optimizableGlobals = getOptimizableGlobals(safeGlobal);
  const scopedEvaluatorFactory = createScopedEvaluatorFactory(unsafeRec, optimizableGlobals);

  function factory(endowments = {}) {
    // todo (shim limitation): scan endowments, throw error if endowment
    // overlaps with the const optimization (which would otherwise
    // incorrectly shadow endowments), or if endowments includes 'eval'. Also
    // prohibit accessor properties (to be able to consistently explain
    // things in terms of shimming the global lexical scope).
    // writeable-vs-nonwritable == let-vs-const, but there's no
    // global-lexical-scope equivalent of an accessor, outside what we can
    // explain/spec
    const scopeTarget = create(safeGlobal, getOwnPropertyDescriptors(endowments));
    const scopeProxy = new Proxy(scopeTarget, scopeHandler);
    const scopedEvaluator = apply(scopedEvaluatorFactory, safeGlobal, [scopeProxy]); // We use the the concise method syntax to create an eval without a
    // [[Construct]] behavior (such that the invocation "new eval()" throws
    // TypeError: eval is not a constructor"), but which still accepts a
    // 'this' binding.

    const safeEval = {
      eval(src) {
        src = `${src}`;
        rejectImportExpressions(src);
        scopeHandler.allowUnsafeEvaluatorOnce();
        let err;

        try {
          // Ensure that "this" resolves to the safe global.
          return apply(scopedEvaluator, safeGlobal, [src]);
        } catch (e) {
          // stash the child-code error in hopes of debugging the internal failure
          err = e;
          throw e;
        } finally {
          // belt and suspenders: the proxy switches this off immediately after
          // the first access, but if that's not the case we abort.
          if (scopeHandler.unsafeEvaluatorAllowed()) {
            throwTantrum('handler did not revoke useUnsafeEvaluator', err);
          }
        }
      }

    }.eval; // safeEval's prototype is currently the primal realm's
    // Function.prototype, which we must not let escape. To make 'eval
    // instanceof Function' be true inside the realm, we need to point it at
    // the RootRealm's value.
    // Ensure that eval from any compartment in a root realm is an instance
    // of Function in any compartment of the same root realm.

    setPrototypeOf(safeEval, unsafeFunction.prototype);
    assert(getPrototypeOf(safeEval).constructor !== Function, 'hide Function');
    assert(getPrototypeOf(safeEval).constructor !== unsafeFunction, 'hide unsafeFunction'); // note: be careful to not leak our primal Function.prototype by setting
    // this to a plain arrow function. Now that we have safeEval, use it.

    defineProperties(safeEval, {
      toString: {
        value: safeEval("() => 'function eval() { [shim code] }'"),
        writable: false,
        enumerable: false,
        configurable: true
      }
    });
    return safeEval;
  }

  return factory;
}

function createSafeEvaluator(safeEvaluatorFactory) {
  return safeEvaluatorFactory();
}

function createSafeEvaluatorWhichTakesEndowments(safeEvaluatorFactory) {
  return (x, endowments) => safeEvaluatorFactory(endowments)(x);
}
/**
 * A safe version of the native Function which relies on
 * the safety of evalEvaluator for confinement.
 */


function createFunctionEvaluator(unsafeRec, safeEval) {
  const {
    unsafeFunction,
    unsafeGlobal
  } = unsafeRec;

  const safeFunction = function Function(...params) {
    const functionBody = `${arrayPop(params) || ''}`;
    let functionParams = `${arrayJoin(params, ',')}`;

    if (!regexpTest(/^[\w\s,]*$/, functionParams)) {
      throw new unsafeGlobal.SyntaxError('shim limitation: Function arg must be simple ASCII identifiers, possibly separated by commas: no default values, pattern matches, or non-ASCII parameter names'); // this protects against Matt Austin's clever attack:
      // Function("arg=`", "/*body`){});({x: this/**/")
      // which would turn into
      //     (function(arg=`
      //     /*``*/){
      //      /*body`){});({x: this/**/
      //     })
      // which parses as a default argument of `\n/*``*/){\n/*body` , which
      // is a pair of template literals back-to-back (so the first one
      // nominally evaluates to the parser to use on the second one), which
      // can't actually execute (because the first literal evals to a string,
      // which can't be a parser function), but that doesn't matter because
      // the function is bypassed entirely. When that gets evaluated, it
      // defines (but does not invoke) a function, then evaluates a simple
      // {x: this} expression, giving access to the safe global.
    } // Is this a real functionBody, or is someone attempting an injection
    // attack? This will throw a SyntaxError if the string is not actually a
    // function body. We coerce the body into a real string above to prevent
    // someone from passing an object with a toString() that returns a safe
    // string the first time, but an evil string the second time.
    // eslint-disable-next-line no-new, new-cap


    new unsafeFunction(functionBody);

    if (stringIncludes(functionParams, ')')) {
      // If the formal parameters string include ) - an illegal
      // character - it may make the combined function expression
      // compile. We avoid this problem by checking for this early on.
      // note: v8 throws just like this does, but chrome accepts e.g. 'a = new Date()'
      throw new unsafeGlobal.SyntaxError('shim limitation: Function arg string contains parenthesis'); // todo: shim integrity threat if they change SyntaxError
    } // todo: check to make sure this .length is safe. markm says safe.


    if (functionParams.length > 0) {
      // If the formal parameters include an unbalanced block comment, the
      // function must be rejected. Since JavaScript does not allow nested
      // comments we can include a trailing block comment to catch this.
      functionParams += '\n/*``*/';
    } // todo: fix `this` binding in Function().


    const src = `(function(${functionParams}){\n${functionBody}\n})`;
    return safeEval(src);
  }; // Ensure that Function from any compartment in a root realm can be used
  // with instance checks in any compartment of the same root realm.


  setPrototypeOf(safeFunction, unsafeFunction.prototype);
  assert(getPrototypeOf(safeFunction).constructor !== Function, 'hide Function');
  assert(getPrototypeOf(safeFunction).constructor !== unsafeFunction, 'hide unsafeFunction');
  defineProperties(safeFunction, {
    // Ensure that any function created in any compartment in a root realm is an
    // instance of Function in any compartment of the same root ralm.
    prototype: {
      value: unsafeFunction.prototype
    },
    // Provide a custom output without overwriting the Function.prototype.toString
    // which is called by some third-party libraries.
    toString: {
      value: safeEval("() => 'function Function() { [shim code] }'"),
      writable: false,
      enumerable: false,
      configurable: true
    }
  });
  return safeFunction;
} // Mimic private members on the realm instances.
// We define it in the same module and do not export it.


const RealmRecForRealmInstance = new WeakMap();

function getRealmRecForRealmInstance(realm) {
  // Detect non-objects.
  assert(Object(realm) === realm, 'bad object, not a Realm instance'); // Realm instance has no realmRec. Should not proceed.

  assert(RealmRecForRealmInstance.has(realm), 'Realm instance has no record');
  return RealmRecForRealmInstance.get(realm);
}

function registerRealmRecForRealmInstance(realm, realmRec) {
  // Detect non-objects.
  assert(Object(realm) === realm, 'bad object, not a Realm instance'); // Attempt to change an existing realmRec on a realm instance. Should not proceed.

  assert(!RealmRecForRealmInstance.has(realm), 'Realm instance already has a record');
  RealmRecForRealmInstance.set(realm, realmRec);
} // Initialize the global variables for the new Realm.


function setDefaultBindings(sharedGlobalDescs, safeGlobal, safeEval, safeFunction) {
  defineProperties(safeGlobal, sharedGlobalDescs);
  defineProperties(safeGlobal, {
    eval: {
      value: safeEval,
      writable: true,
      configurable: true
    },
    Function: {
      value: safeFunction,
      writable: true,
      configurable: true
    }
  });
}

function createRealmRec(unsafeRec) {
  const {
    sharedGlobalDescs,
    unsafeGlobal
  } = unsafeRec;
  const safeGlobal = create(unsafeGlobal.Object.prototype);
  const safeEvaluatorFactory = createSafeEvaluatorFactory(unsafeRec, safeGlobal);
  const safeEval = createSafeEvaluator(safeEvaluatorFactory);
  const safeEvalWhichTakesEndowments = createSafeEvaluatorWhichTakesEndowments(safeEvaluatorFactory);
  const safeFunction = createFunctionEvaluator(unsafeRec, safeEval);
  setDefaultBindings(sharedGlobalDescs, safeGlobal, safeEval, safeFunction);
  const realmRec = freeze({
    safeGlobal,
    safeEval,
    safeEvalWhichTakesEndowments,
    safeFunction
  });
  return realmRec;
}
/**
 * A root realm uses a fresh set of new intrinics. Here we first create
 * a new unsafe record, which inherits the shims. Then we proceed with
 * the creation of the realm record, and we apply the shims.
 */


function initRootRealm(parentUnsafeRec, self, options) {
  // note: 'self' is the instance of the Realm.
  // todo: investigate attacks via Array.species
  // todo: this accepts newShims='string', but it should reject that
  const {
    shims: newShims
  } = options;
  const allShims = arrayConcat(parentUnsafeRec.allShims, newShims); // The unsafe record is created already repaired.

  const unsafeRec = createNewUnsafeRec(allShims); // eslint-disable-next-line no-use-before-define

  const Realm = createRealmFacade(unsafeRec, BaseRealm); // Add a Realm descriptor to sharedGlobalDescs, so it can be defined onto the
  // safeGlobal like the rest of the globals.

  unsafeRec.sharedGlobalDescs.Realm = {
    value: Realm,
    writable: true,
    configurable: true
  }; // Creating the realmRec provides the global object, eval() and Function()
  // to the realm.

  const realmRec = createRealmRec(unsafeRec); // Apply all shims in the new RootRealm. We don't do this for compartments.

  const {
    safeEvalWhichTakesEndowments
  } = realmRec;

  for (const shim of allShims) {
    safeEvalWhichTakesEndowments(shim);
  } // The realmRec acts as a private field on the realm instance.


  registerRealmRecForRealmInstance(self, realmRec);
}
/**
 * A compartment shares the intrinsics of its root realm. Here, only a
 * realmRec is necessary to hold the global object, eval() and Function().
 */


function initCompartment(unsafeRec, self) {
  // note: 'self' is the instance of the Realm.
  const realmRec = createRealmRec(unsafeRec); // The realmRec acts as a private field on the realm instance.

  registerRealmRecForRealmInstance(self, realmRec);
}

function getRealmGlobal(self) {
  const {
    safeGlobal
  } = getRealmRecForRealmInstance(self);
  return safeGlobal;
}

function realmEvaluate(self, x, endowments = {}) {
  // todo: don't pass in primal-realm objects like {}, for safety. OTOH its
  // properties are copied onto the new global 'target'.
  // todo: figure out a way to membrane away the contents to safety.
  const {
    safeEvalWhichTakesEndowments
  } = getRealmRecForRealmInstance(self);
  return safeEvalWhichTakesEndowments(x, endowments);
}

const BaseRealm = {
  initRootRealm,
  initCompartment,
  getRealmGlobal,
  realmEvaluate
}; // Create the current unsafeRec from the current "primal" environment (the realm
// where the Realm shim is loaded and executed).

const currentUnsafeRec = createCurrentUnsafeRec();
/**
 * The "primal" realm class is defined in the current "primal" environment,
 * and is part of the shim. There is no need to facade this class via evaluation
 * because both share the same intrinsics.
 */

const Realm = buildChildRealm(currentUnsafeRec, BaseRealm);

function tameDate() {
  const unsafeDate = Date; // Date(anything) gives a string with the current time
  // new Date(x) coerces x into a number and then returns a Date
  // new Date() returns the current time, as a Date object
  // new Date(undefined) returns a Date object which stringifies to 'Invalid Date'

  const newDateConstructor = function Date(...args) {
    if (new.target === undefined) {
      // we were not called as a constructor
      // this would normally return a string with the current time
      return 'Invalid Date';
    } // constructor behavior: if we get arguments, we can safely pass them through


    if (args.length > 0) {
      return Reflect.construct(unsafeDate, args, new.target); // todo: test that our constructor can still be subclassed
    } // no arguments: return a Date object, but invalid


    return Reflect.construct(unsafeDate, [NaN], new.target);
  };

  Object.defineProperties(newDateConstructor, Object.getOwnPropertyDescriptors(unsafeDate)); // that will copy the .prototype too, so this next line is unnecessary
  // newDateConstructor.prototype = unsafeDate.prototype;

  unsafeDate.prototype.constructor = newDateConstructor; // disable Date.now

  newDateConstructor.now = () => NaN;

  Date = newDateConstructor; // eslint-disable-line no-global-assign
}

function tameMath() {
  // Math.random = () => 4; // https://www.xkcd.com/221
  Math.random = () => {
    throw Error('disabled');
  };
}
/* global Intl */


function tameIntl() {
  // todo: somehow fix these. These almost certainly don't enable the reading
  // of side-channels, but we want things to be deterministic across
  // runtimes. Best bet is to just disallow calling these functions without
  // an explicit locale name.
  // the whitelist may have deleted Intl entirely, so tolerate that
  if (typeof Intl !== 'undefined') {
    Intl.DateTimeFormat = () => {
      throw Error('disabled');
    };

    Intl.NumberFormat = () => {
      throw Error('disabled');
    };

    Intl.getCanonicalLocales = () => {
      throw Error('disabled');
    };
  } // eslint-disable-next-line no-extend-native


  Object.prototype.toLocaleString = () => {
    throw new Error('toLocaleString suppressed');
  };
}

function tameError() {
  if (!Object.isExtensible(Error)) {
    throw Error('huh Error is not extensible');
  }
  /* this worked back when we were running it on a global, but stopped
  working when we turned it into a shim */

  /*
  Object.defineProperty(Error.prototype, "stack",
                        { get() { return 'stack suppressed'; } });
  */


  delete Error.captureStackTrace;

  if ('captureStackTrace' in Error) {
    throw Error('hey we could not remove Error.captureStackTrace');
  } // we might do this in the future

  /*
  const unsafeError = Error;
  const newErrorConstructor = function Error(...args) {
    return Reflect.construct(unsafeError, args, new.target);
  };
   newErrorConstructor.prototype = unsafeError.prototype;
  newErrorConstructor.prototype.construct = newErrorConstructor;
   Error = newErrorConstructor;
   EvalError.__proto__ = newErrorConstructor;
  RangeError.__proto__ = newErrorConstructor;
  ReferenceError.__proto__ = newErrorConstructor;
  SyntaxError.__proto__ = newErrorConstructor;
  TypeError.__proto__ = newErrorConstructor;
  URIError.__proto__ = newErrorConstructor;
  */

}

function tameRegExp() {
  delete RegExp.prototype.compile;

  if ('compile' in RegExp.prototype) {
    throw Error('hey we could not remove RegExp.prototype.compile');
  } // We want to delete RegExp.$1, as well as any other surprising properties.
  // On some engines we can't just do 'delete RegExp.$1'.


  const unsafeRegExp = RegExp; // eslint-disable-next-line no-global-assign

  RegExp = function RegExp(...args) {
    return Reflect.construct(unsafeRegExp, args, new.target);
  };

  RegExp.prototype = unsafeRegExp.prototype;
  unsafeRegExp.prototype.constructor = RegExp;

  if ('$1' in RegExp) {
    throw Error('hey we could not remove RegExp.$1');
  }
}
/* global getAnonIntrinsics */
// Copyright (C) 2011 Google Inc.
// Copyright (C) 2018 Agoric
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* This is evaluated in an environment in which getAnonIntrinsics() is
   already defined (by prepending the definition of getAnonIntrinsics to the
   stringified removeProperties()), hence we don't use the following
   import */
// import { getAnonIntrinsics } from './anonIntrinsics.js';


function removeProperties(global, whitelist) {
  // walk global object, test against whitelist, delete
  const uncurryThis = fn => (thisArg, ...args) => Reflect.apply(fn, thisArg, args);

  const {
    getOwnPropertyDescriptor: gopd,
    getOwnPropertyNames: gopn,
    keys
  } = Object;
  const cleaning = new WeakMap();
  const getProto = Object.getPrototypeOf;
  const hop = uncurryThis(Object.prototype.hasOwnProperty);
  const whiteTable = new WeakMap();

  function addToWhiteTable(rootValue, rootPermit) {
    /**
     * The whiteTable should map from each path-accessible primordial
     * object to the permit object that describes how it should be
     * cleaned.
     *
     * We initialize the whiteTable only so that {@code getPermit} can
     * process "*" inheritance using the whitelist, by walking actual
     * inheritance chains.
     */
    const whitelistSymbols = [true, false, '*', 'maybeAccessor'];

    function register(value, permit) {
      if (value !== Object(value)) {
        return;
      }

      if (typeof permit !== 'object') {
        if (whitelistSymbols.indexOf(permit) < 0) {
          throw new Error(`syntax error in whitelist; unexpected value: ${permit}`);
        }

        return;
      }

      if (whiteTable.has(value)) {
        throw new Error('primordial reachable through multiple paths');
      }

      whiteTable.set(value, permit);
      keys(permit).forEach(name => {
        // Use gopd to avoid invoking an accessor property.
        // Accessor properties for which permit !== 'maybeAccessor'
        // are caught later by clean().
        const desc = gopd(value, name);

        if (desc) {
          register(desc.value, permit[name]);
        }
      });
    }

    register(rootValue, rootPermit);
  }
  /**
   * Should the property named {@code name} be whitelisted on the
   * {@code base} object, and if so, with what Permit?
   *
   * <p>If it should be permitted, return the Permit (where Permit =
   * true | "maybeAccessor" | "*" | Record(Permit)), all of which are
   * truthy. If it should not be permitted, return false.
   */


  function getPermit(base, name) {
    let permit = whiteTable.get(base);

    if (permit) {
      if (hop(permit, name)) {
        return permit[name];
      }
    } // eslint-disable-next-line no-constant-condition


    while (true) {
      base = getProto(base); // eslint-disable-line no-param-reassign

      if (base === null) {
        return false;
      }

      permit = whiteTable.get(base);

      if (permit && hop(permit, name)) {
        const result = permit[name];

        if (result === '*') {
          return result;
        }

        return false;
      }
    }
  }
  /**
   * Removes all non-whitelisted properties found by recursively and
   * reflectively walking own property chains.
   *
   * <p>Inherited properties are not checked, because we require that
   * inherited-from objects are otherwise reachable by this traversal.
   */


  function clean(value, prefix, num) {
    if (value !== Object(value)) {
      return;
    }

    if (cleaning.get(value)) {
      return;
    }

    const proto = getProto(value);

    if (proto !== null && !whiteTable.has(proto)) {
      // reportItemProblem(rootReports, ses.severities.NOT_ISOLATED,
      //                  'unexpected intrinsic', prefix + '.__proto__');
      throw new Error(`unexpected intrinsic ${prefix}.__proto__`);
    }

    cleaning.set(value, true);
    gopn(value).forEach(name => {
      const path = prefix + (prefix ? '.' : '') + name;
      const p = getPermit(value, name);

      if (p) {
        const desc = gopd(value, name);

        if (hop(desc, 'value')) {
          // Is a data property
          const subValue = desc.value;
          clean(subValue, path, num + 1);
        } else if (p !== 'maybeAccessor') {
          // We are not saying that it is safe for the prop to be
          // unexpectedly an accessor; rather, it will be deleted
          // and thus made safe.
          // reportProperty(ses.severities.SAFE_SPEC_VIOLATION,
          //               'Not a data property', path);
          delete value[name]; // eslint-disable-line no-param-reassign
        } else {
          clean(desc.get, `${path}<getter>`, num + 1);
          clean(desc.set, `${path}<setter>`, num + 1);
        }
      } else {
        delete value[name]; // eslint-disable-line no-param-reassign
      }
    });
  }

  addToWhiteTable(global, whitelist.namedIntrinsics);
  const intr = getAnonIntrinsics(global);
  addToWhiteTable(intr, whitelist.anonIntrinsics);
  clean(global, '', 0);
} // Copyright (C) 2011 Google Inc.
// Copyright (C) 2018 Agoric
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// TODO(erights): We should test for
// We now have a reason to omit Proxy from the whitelist.
// The makeBrandTester in repairES5 uses Allen's trick at
// https://esdiscuss.org/topic/tostringtag-spoofing-for-null-and-undefined#content-59
// , but testing reveals that, on FF 35.0.1, a proxy on an exotic
// object X will pass this brand test when X will. This is fixed as of
// FF Nightly 38.0a1.

/**
 * <p>Qualifying platforms generally include all JavaScript platforms
 * shown on <a href="http://kangax.github.com/es5-compat-table/"
 * >ECMAScript 5 compatibility table</a> that implement {@code
 * Object.getOwnPropertyNames}. At the time of this writing,
 * qualifying browsers already include the latest released versions of
 * Internet Explorer (9), Firefox (4), Chrome (11), and Safari
 * (5.0.5), their corresponding standalone (e.g., server-side) JavaScript
 * engines, Rhino 1.73, and BESEN.
 *
 * <p>On such not-quite-ES5 platforms, some elements of these
 * emulations may lose SES safety, as enumerated in the comment on
 * each problem record in the {@code baseProblems} and {@code
 * supportedProblems} array below. The platform must at least provide
 * {@code Object.getOwnPropertyNames}, because it cannot reasonably be
 * emulated.
 *
 * <p>This file is useful by itself, as it has no dependencies on the
 * rest of SES. It creates no new global bindings, but merely repairs
 * standard globals or standard elements reachable from standard
 * globals. If the future-standard {@code WeakMap} global is present,
 * as it is currently on FF7.0a1, then it will repair it in place. The
 * one non-standard element that this file uses is {@code console} if
 * present, in order to report the repairs it found necessary, in
 * which case we use its {@code log, info, warn}, and {@code error}
 * methods. If {@code console.log} is absent, then this file performs
 * its repairs silently.
 *
 * <p>Generally, this file should be run as the first script in a
 * JavaScript context (i.e. a browser frame), as it relies on other
 * primordial objects and methods not yet being perturbed.
 *
 * <p>TODO(erights): This file tries to protect itself from some
 * post-initialization perturbation by stashing some of the
 * primordials it needs for later use, but this attempt is currently
 * incomplete. We need to revisit this when we support Confined-ES5,
 * as a variant of SES in which the primordials are not frozen. See
 * previous failed attempt at <a
 * href="https://codereview.appspot.com/5278046/" >Speeds up
 * WeakMap. Preparing to support unfrozen primordials.</a>. From
 * analysis of this failed attempt, it seems that the only practical
 * way to support CES is by use of two frames, where most of initSES
 * runs in a SES frame, and so can avoid worrying about most of these
 * perturbations.
 */


function getAnonIntrinsics$1(global) {
  const gopd = Object.getOwnPropertyDescriptor;
  const getProto = Object.getPrototypeOf; // ////////////// Undeniables and Intrinsics //////////////

  /**
   * The undeniables are the primordial objects which are ambiently
   * reachable via compositions of strict syntax, primitive wrapping
   * (new Object(x)), and prototype navigation (the equivalent of
   * Object.getPrototypeOf(x) or x.__proto__). Although we could in
   * theory monkey patch primitive wrapping or prototype navigation,
   * we won't. Hence, without parsing, the following are undeniable no
   * matter what <i>other</i> monkey patching we do to the primordial
   * environment.
   */
  // The first element of each undeniableTuple is a string used to
  // name the undeniable object for reporting purposes. It has no
  // other programmatic use.
  //
  // The second element of each undeniableTuple should be the
  // undeniable itself.
  //
  // The optional third element of the undeniableTuple, if present,
  // should be an example of syntax, rather than use of a monkey
  // patchable API, evaluating to a value from which the undeniable
  // object in the second element can be reached by only the
  // following steps:
  // If the value is primitve, convert to an Object wrapper.
  // Is the resulting object either the undeniable object, or does
  // it inherit directly from the undeniable object?

  function* aStrictGenerator() {} // eslint-disable-line no-empty-function


  const Generator = getProto(aStrictGenerator);

  async function* aStrictAsyncGenerator() {} // eslint-disable-line no-empty-function


  const AsyncGenerator = getProto(aStrictAsyncGenerator);

  async function aStrictAsyncFunction() {} // eslint-disable-line no-empty-function


  const AsyncFunctionPrototype = getProto(aStrictAsyncFunction); // TODO: this is dead code, but could be useful: make this the
  // 'undeniables' object available via some API.

  const undeniableTuples = [['Object.prototype', Object.prototype, {}], ['Function.prototype', Function.prototype, function foo() {}], ['Array.prototype', Array.prototype, []], ['RegExp.prototype', RegExp.prototype, /x/], ['Boolean.prototype', Boolean.prototype, true], ['Number.prototype', Number.prototype, 1], ['String.prototype', String.prototype, 'x'], ['%Generator%', Generator, aStrictGenerator], ['%AsyncGenerator%', AsyncGenerator, aStrictAsyncGenerator], ['%AsyncFunction%', AsyncFunctionPrototype, aStrictAsyncFunction]];
  undeniableTuples.forEach(tuple => {
    const name = tuple[0];
    const undeniable = tuple[1];
    let start = tuple[2];

    if (start === undefined) {
      return;
    }

    start = Object(start);

    if (undeniable === start) {
      return;
    }

    if (undeniable === getProto(start)) {
      return;
    }

    throw new Error(`Unexpected undeniable: ${undeniable}`);
  });

  function registerIteratorProtos(registery, base, name) {
    const iteratorSym = global.Symbol && global.Symbol.iterator || '@@iterator'; // used instead of a symbol on FF35

    if (base[iteratorSym]) {
      const anIter = base[iteratorSym]();
      const anIteratorPrototype = getProto(anIter);
      registery[name] = anIteratorPrototype; // eslint-disable-line no-param-reassign

      const anIterProtoBase = getProto(anIteratorPrototype);

      if (anIterProtoBase !== Object.prototype) {
        if (!registery.IteratorPrototype) {
          if (getProto(anIterProtoBase) !== Object.prototype) {
            throw new Error('%IteratorPrototype%.__proto__ was not Object.prototype');
          }

          registery.IteratorPrototype = anIterProtoBase; // eslint-disable-line no-param-reassign
        } else if (registery.IteratorPrototype !== anIterProtoBase) {
          throw new Error(`unexpected %${name}%.__proto__`);
        }
      }
    }
  }
  /**
   * Get the intrinsics not otherwise reachable by named own property
   * traversal. See
   * https://people.mozilla.org/~jorendorff/es6-draft.html#sec-well-known-intrinsic-objects
   * and the instrinsics section of whitelist.js
   *
   * <p>Unlike getUndeniables(), the result of sampleAnonIntrinsics()
   * does depend on the current state of the primordials, so we must
   * run this again after all other relevant monkey patching is done,
   * in order to properly initialize cajaVM.intrinsics
   */
  // TODO: we can probably unwrap this into the outer function, and stop
  // using a separately named 'sampleAnonIntrinsics'


  function sampleAnonIntrinsics() {
    const result = {}; // If there are still other ThrowTypeError objects left after
    // noFuncPoison-ing, this should be caught by
    // test_THROWTYPEERROR_NOT_UNIQUE below, so we assume here that
    // this is the only surviving ThrowTypeError intrinsic.
    // eslint-disable-next-line prefer-rest-params

    result.ThrowTypeError = gopd(arguments, 'callee').get; // Get the ES6 %ArrayIteratorPrototype%,
    // %StringIteratorPrototype%, %MapIteratorPrototype%,
    // %SetIteratorPrototype% and %IteratorPrototype% intrinsics, if
    // present.

    registerIteratorProtos(result, [], 'ArrayIteratorPrototype');
    registerIteratorProtos(result, '', 'StringIteratorPrototype');

    if (typeof Map === 'function') {
      registerIteratorProtos(result, new Map(), 'MapIteratorPrototype');
    }

    if (typeof Set === 'function') {
      registerIteratorProtos(result, new Set(), 'SetIteratorPrototype');
    } // Get the ES6 %GeneratorFunction% intrinsic, if present.


    if (getProto(Generator) !== Function.prototype) {
      throw new Error('Generator.__proto__ was not Function.prototype');
    }

    const GeneratorFunction = Generator.constructor;

    if (getProto(GeneratorFunction) !== Function.prototype.constructor) {
      throw new Error('GeneratorFunction.__proto__ was not Function.prototype.constructor');
    }

    result.GeneratorFunction = GeneratorFunction;
    const genProtoBase = getProto(Generator.prototype);

    if (genProtoBase !== result.IteratorPrototype) {
      throw new Error('Unexpected Generator.prototype.__proto__');
    } // Get the ES6 %AsyncGeneratorFunction% intrinsic, if present.


    if (getProto(AsyncGenerator) !== Function.prototype) {
      throw new Error('AsyncGenerator.__proto__ was not Function.prototype');
    }

    const AsyncGeneratorFunction = AsyncGenerator.constructor;

    if (getProto(AsyncGeneratorFunction) !== Function.prototype.constructor) {
      throw new Error('AsyncGeneratorFunction.__proto__ was not Function.prototype.constructor');
    }

    result.AsyncGeneratorFunction = AsyncGeneratorFunction;
    const AsyncGeneratorPrototype = AsyncGenerator.prototype;
    result.AsyncIteratorPrototype = getProto(AsyncGeneratorPrototype); // it appears that the only way to get an AsyncIteratorPrototype is
    // through this getProto() process, so there's nothing to check it
    // against

    if (getProto(result.AsyncIteratorPrototype) !== Object.prototype) {
      throw new Error('AsyncIteratorPrototype.__proto__ was not Object.prototype');
    } // Get the ES6 %AsyncFunction% intrinsic, if present.


    if (getProto(AsyncFunctionPrototype) !== Function.prototype) {
      throw new Error('AsyncFunctionPrototype.__proto__ was not Function.prototype');
    }

    const AsyncFunction = AsyncFunctionPrototype.constructor;

    if (getProto(AsyncFunction) !== Function.prototype.constructor) {
      throw new Error('AsyncFunction.__proto__ was not Function.prototype.constructor');
    }

    result.AsyncFunction = AsyncFunction; // Get the ES6 %TypedArray% intrinsic, if present.

    (function getTypedArray() {
      if (!global.Float32Array) {
        return;
      }

      const TypedArray = getProto(global.Float32Array);

      if (TypedArray === Function.prototype) {
        return;
      }

      if (getProto(TypedArray) !== Function.prototype) {
        // http://bespin.cz/~ondras/html/classv8_1_1ArrayBufferView.html
        // has me worried that someone might make such an intermediate
        // object visible.
        throw new Error('TypedArray.__proto__ was not Function.prototype');
      }

      result.TypedArray = TypedArray;
    })();

    Object.keys(result).forEach(name => {
      if (result[name] === undefined) {
        throw new Error(`Malformed intrinsic: ${name}`);
      }
    });
    return result;
  }

  return sampleAnonIntrinsics();
}

function getAllPrimordials(global, anonIntrinsics) {
  const root = {
    global,
    // global plus all the namedIntrinsics
    anonIntrinsics
  }; // todo: re-examine exactly which "global" we're freezing

  return root;
} // Copyright (C) 2011 Google Inc.
// Copyright (C) 2018 Agoric
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Exports {@code ses.whitelist}, a recursively defined
 * JSON record enumerating all the naming paths in the ES5.1 spec,
 * those de-facto extensions that we judge to be safe, and SES and
 * Dr. SES extensions provided by the SES runtime.
 *
 * <p>Assumes only ES3. Compatible with ES5, ES5-strict, or
 * anticipated ES6.
 *
 * //provides ses.whitelist
 * @author Mark S. Miller,
 * @overrides ses, whitelistModule
 */

/**
 * <p>Each JSON record enumerates the disposition of the properties on
 * some corresponding primordial object, with the root record
 * representing the global object. For each such record, the values
 * associated with its property names can be
 * <ul>
 * <li>Another record, in which case this property is simply
 *     whitelisted and that next record represents the disposition of
 *     the object which is its value. For example, {@code "Object"}
 *     leads to another record explaining what properties {@code
 *     "Object"} may have and how each such property, if present,
 *     and its value should be tamed.
 * <li>true, in which case this property is simply whitelisted. The
 *     value associated with that property is still traversed and
 *     tamed, but only according to the taming of the objects that
 *     object inherits from. For example, {@code "Object.freeze"} leads
 *     to true, meaning that the {@code "freeze"} property of {@code
 *     Object} should be whitelisted and the value of the property (a
 *     function) should be further tamed only according to the
 *     markings of the other objects it inherits from, like {@code
 *     "Function.prototype"} and {@code "Object.prototype").
 *     If the property is an accessor property, it is not
 *     whitelisted (as invoking an accessor might not be meaningful,
 *     yet the accessor might return a value needing taming).
 * <li>"maybeAccessor", in which case this accessor property is simply
 *     whitelisted and its getter and/or setter are tamed according to
 *     inheritance. If the property is not an accessor property, its
 *     value is tamed according to inheritance.
 * <li>"*", in which case this property on this object is whitelisted,
 *     as is this property as inherited by all objects that inherit
 *     from this object. The values associated with all such properties
 *     are still traversed and tamed, but only according to the taming
 *     of the objects that object inherits from. For example, {@code
 *     "Object.prototype.constructor"} leads to "*", meaning that we
 *     whitelist the {@code "constructor"} property on {@code
 *     Object.prototype} and on every object that inherits from {@code
 *     Object.prototype} that does not have a conflicting mark. Each
 *     of these is tamed as if with true, so that the value of the
 *     property is further tamed according to what other objects it
 *     inherits from.
 * <li>false, which suppresses permission inherited via "*".
 * </ul>
 *
 * <p>TODO: We want to do for constructor: something weaker than '*',
 * but rather more like what we do for [[Prototype]] links, which is
 * that it is whitelisted only if it points at an object which is
 * otherwise reachable by a whitelisted path.
 *
 * <p>The members of the whitelist are either
 * <ul>
 * <li>(uncommented) defined by the ES5.1 normative standard text,
 * <li>(questionable) provides a source of non-determinism, in
 *     violation of pure object-capability rules, but allowed anyway
 *     since we've given up on restricting JavaScript to a
 *     deterministic subset.
 * <li>(ES5 Appendix B) common elements of de facto JavaScript
 *     described by the non-normative Appendix B.
 * <li>(Harmless whatwg) extensions documented at
 *     <a href="http://wiki.whatwg.org/wiki/Web_ECMAScript"
 *     >http://wiki.whatwg.org/wiki/Web_ECMAScript</a> that seem to be
 *     harmless. Note that the RegExp constructor extensions on that
 *     page are <b>not harmless</b> and so must not be whitelisted.
 * <li>(ES-Harmony proposal) accepted as "proposal" status for
 *     EcmaScript-Harmony.
 * </ul>
 *
 * <p>With the above encoding, there are some sensible whitelists we
 * cannot express, such as marking a property both with "*" and a JSON
 * record. This is an expedient decision based only on not having
 * encountered such a need. Should we need this extra expressiveness,
 * we'll need to refactor to enable a different encoding.
 *
 * <p>We factor out {@code true} into the variable {@code t} just to
 * get a bit better compression from simple minifiers.
 */


const t = true;
const j = true; // included in the Jessie runtime

let TypedArrayWhitelist; // defined and used below

var whitelist = {
  // The accessible intrinsics which are not reachable by own
  // property name traversal are listed here so that they are
  // processed by the whitelist, although this also makes them
  // accessible by this path.  See
  // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-well-known-intrinsic-objects
  // Of these, ThrowTypeError is the only one from ES5. All the
  // rest were introduced in ES6.
  anonIntrinsics: {
    ThrowTypeError: {},
    IteratorPrototype: {
      // 25.1
      // Technically, for SES-on-ES5, we should not need to
      // whitelist 'next'. However, browsers are accidentally
      // relying on it
      // https://bugs.chromium.org/p/v8/issues/detail?id=4769#
      // https://bugs.webkit.org/show_bug.cgi?id=154475
      // and we will be whitelisting it as we transition to ES6
      // anyway, so we unconditionally whitelist it now.
      next: '*',
      constructor: false
    },
    ArrayIteratorPrototype: {},
    StringIteratorPrototype: {},
    MapIteratorPrototype: {},
    SetIteratorPrototype: {},
    // AsyncIteratorPrototype does not inherit from IteratorPrototype
    AsyncIteratorPrototype: {},
    // The %GeneratorFunction% intrinsic is the constructor of
    // generator functions, so %GeneratorFunction%.prototype is
    // the %Generator% intrinsic, which all generator functions
    // inherit from. A generator function is effectively the
    // constructor of its generator instances, so, for each
    // generator function (e.g., "g1" on the diagram at
    // http://people.mozilla.org/~jorendorff/figure-2.png )
    // its .prototype is a prototype that its instances inherit
    // from. Paralleling this structure, %Generator%.prototype,
    // i.e., %GeneratorFunction%.prototype.prototype, is the
    // object that all these generator function prototypes inherit
    // from. The .next, .return and .throw that generator
    // instances respond to are actually the builtin methods they
    // inherit from this object.
    GeneratorFunction: {
      // 25.2
      length: '*',
      // Not sure why this is needed
      prototype: {
        // 25.4
        prototype: {
          next: '*',
          return: '*',
          throw: '*',
          constructor: '*' // Not sure why this is needed

        }
      }
    },
    AsyncGeneratorFunction: {
      // 25.3
      length: '*',
      prototype: {
        // 25.5
        prototype: {
          next: '*',
          return: '*',
          throw: '*',
          constructor: '*' // Not sure why this is needed

        }
      }
    },
    AsyncFunction: {
      // 25.7
      length: '*',
      prototype: '*'
    },
    TypedArray: TypedArrayWhitelist = {
      // 22.2
      length: '*',
      // does not inherit from Function.prototype on Chrome
      name: '*',
      // ditto
      from: t,
      of: t,
      BYTES_PER_ELEMENT: '*',
      prototype: {
        buffer: 'maybeAccessor',
        byteLength: 'maybeAccessor',
        byteOffset: 'maybeAccessor',
        copyWithin: '*',
        entries: '*',
        every: '*',
        fill: '*',
        filter: '*',
        find: '*',
        findIndex: '*',
        forEach: '*',
        includes: '*',
        indexOf: '*',
        join: '*',
        keys: '*',
        lastIndexOf: '*',
        length: 'maybeAccessor',
        map: '*',
        reduce: '*',
        reduceRight: '*',
        reverse: '*',
        set: '*',
        slice: '*',
        some: '*',
        sort: '*',
        subarray: '*',
        values: '*',
        BYTES_PER_ELEMENT: '*'
      }
    }
  },
  namedIntrinsics: {
    // In order according to
    // http://www.ecma-international.org/ecma-262/ with chapter
    // numbers where applicable
    // 18 The Global Object
    // 18.1
    Infinity: j,
    NaN: j,
    undefined: j,
    // 18.2
    // eval: t,                      // Whitelisting under separate control
    // by TAME_GLOBAL_EVAL in startSES.js
    isFinite: t,
    isNaN: t,
    parseFloat: t,
    parseInt: t,
    decodeURI: t,
    decodeURIComponent: t,
    encodeURI: t,
    encodeURIComponent: t,
    // 19 Fundamental Objects
    Object: {
      // 19.1
      assign: t,
      // ES-Harmony
      create: t,
      defineProperties: t,
      // ES-Harmony
      defineProperty: t,
      entries: t,
      // ES-Harmony
      freeze: j,
      getOwnPropertyDescriptor: t,
      getOwnPropertyDescriptors: t,
      // proposed ES-Harmony
      getOwnPropertyNames: t,
      getOwnPropertySymbols: t,
      // ES-Harmony
      getPrototypeOf: t,
      is: j,
      // ES-Harmony
      isExtensible: t,
      isFrozen: t,
      isSealed: t,
      keys: t,
      preventExtensions: j,
      seal: j,
      setPrototypeOf: t,
      // ES-Harmony
      values: t,
      // ES-Harmony
      prototype: {
        // B.2.2
        // __proto__: t, whitelisted manually in startSES.js
        __defineGetter__: t,
        __defineSetter__: t,
        __lookupGetter__: t,
        __lookupSetter__: t,
        constructor: '*',
        hasOwnProperty: t,
        isPrototypeOf: t,
        propertyIsEnumerable: t,
        toLocaleString: '*',
        toString: '*',
        valueOf: '*',
        // Generally allowed
        [Symbol.iterator]: '*',
        [Symbol.toPrimitive]: '*',
        [Symbol.toStringTag]: '*',
        [Symbol.unscopables]: '*'
      }
    },
    Function: {
      // 19.2
      length: t,
      prototype: {
        apply: t,
        bind: t,
        call: t,
        [Symbol.hasInstance]: '*',
        // 19.2.4 instances
        length: '*',
        name: '*',
        // ES-Harmony
        prototype: '*',
        arity: '*',
        // non-std, deprecated in favor of length
        // Generally allowed
        [Symbol.species]: 'maybeAccessor' // ES-Harmony?

      }
    },
    Boolean: {
      // 19.3
      prototype: t
    },
    Symbol: {
      // 19.4               all ES-Harmony
      asyncIterator: t,
      // proposed? ES-Harmony
      for: t,
      hasInstance: t,
      isConcatSpreadable: t,
      iterator: t,
      keyFor: t,
      match: t,
      matchAll: t,
      replace: t,
      search: t,
      species: t,
      split: t,
      toPrimitive: t,
      toStringTag: t,
      unscopables: t,
      prototype: t
    },
    Error: {
      // 19.5
      prototype: {
        name: '*',
        message: '*'
      }
    },
    // In ES6 the *Error "subclasses" of Error inherit from Error,
    // since constructor inheritance generally mirrors prototype
    // inheritance. As explained at
    // https://code.google.com/p/google-caja/issues/detail?id=1963 ,
    // debug.js hides away the Error constructor itself, and so needs
    // to rewire these "subclass" constructors. Until we have a more
    // general mechanism, please maintain this list of whitelisted
    // subclasses in sync with the list in debug.js of subclasses to
    // be rewired.
    EvalError: {
      prototype: t
    },
    RangeError: {
      prototype: t
    },
    ReferenceError: {
      prototype: t
    },
    SyntaxError: {
      prototype: t
    },
    TypeError: {
      prototype: t
    },
    URIError: {
      prototype: t
    },
    // 20 Numbers and Dates
    Number: {
      // 20.1
      EPSILON: t,
      // ES-Harmony
      isFinite: j,
      // ES-Harmony
      isInteger: t,
      // ES-Harmony
      isNaN: j,
      // ES-Harmony
      isSafeInteger: j,
      // ES-Harmony
      MAX_SAFE_INTEGER: j,
      // ES-Harmony
      MAX_VALUE: t,
      MIN_SAFE_INTEGER: j,
      // ES-Harmony
      MIN_VALUE: t,
      NaN: t,
      NEGATIVE_INFINITY: t,
      parseFloat: t,
      // ES-Harmony
      parseInt: t,
      // ES-Harmony
      POSITIVE_INFINITY: t,
      prototype: {
        toExponential: t,
        toFixed: t,
        toPrecision: t
      }
    },
    Math: {
      // 20.2
      E: j,
      LN10: j,
      LN2: j,
      LOG10E: t,
      LOG2E: t,
      PI: j,
      SQRT1_2: t,
      SQRT2: t,
      abs: j,
      acos: t,
      acosh: t,
      // ES-Harmony
      asin: t,
      asinh: t,
      // ES-Harmony
      atan: t,
      atanh: t,
      // ES-Harmony
      atan2: t,
      cbrt: t,
      // ES-Harmony
      ceil: j,
      clz32: t,
      // ES-Harmony
      cos: t,
      cosh: t,
      // ES-Harmony
      exp: t,
      expm1: t,
      // ES-Harmony
      floor: j,
      fround: t,
      // ES-Harmony
      hypot: t,
      // ES-Harmony
      imul: t,
      // ES-Harmony
      log: j,
      log1p: t,
      // ES-Harmony
      log10: j,
      // ES-Harmony
      log2: j,
      // ES-Harmony
      max: j,
      min: j,
      pow: j,
      random: t,
      // questionable
      round: j,
      sign: t,
      // ES-Harmony
      sin: t,
      sinh: t,
      // ES-Harmony
      sqrt: j,
      tan: t,
      tanh: t,
      // ES-Harmony
      trunc: j // ES-Harmony

    },
    // no-arg Date constructor is questionable
    Date: {
      // 20.3
      now: t,
      // questionable
      parse: t,
      UTC: t,
      prototype: {
        // Note: coordinate this list with maintanence of repairES5.js
        getDate: t,
        getDay: t,
        getFullYear: t,
        getHours: t,
        getMilliseconds: t,
        getMinutes: t,
        getMonth: t,
        getSeconds: t,
        getTime: t,
        getTimezoneOffset: t,
        getUTCDate: t,
        getUTCDay: t,
        getUTCFullYear: t,
        getUTCHours: t,
        getUTCMilliseconds: t,
        getUTCMinutes: t,
        getUTCMonth: t,
        getUTCSeconds: t,
        setDate: t,
        setFullYear: t,
        setHours: t,
        setMilliseconds: t,
        setMinutes: t,
        setMonth: t,
        setSeconds: t,
        setTime: t,
        setUTCDate: t,
        setUTCFullYear: t,
        setUTCHours: t,
        setUTCMilliseconds: t,
        setUTCMinutes: t,
        setUTCMonth: t,
        setUTCSeconds: t,
        toDateString: t,
        toISOString: t,
        toJSON: t,
        toLocaleDateString: t,
        toLocaleString: t,
        toLocaleTimeString: t,
        toTimeString: t,
        toUTCString: t,
        // B.2.4
        getYear: t,
        setYear: t,
        toGMTString: t
      }
    },
    // 21 Text Processing
    String: {
      // 21.2
      fromCharCode: j,
      fromCodePoint: t,
      // ES-Harmony
      raw: j,
      // ES-Harmony
      prototype: {
        charAt: t,
        charCodeAt: t,
        codePointAt: t,
        // ES-Harmony
        concat: t,
        endsWith: j,
        // ES-Harmony
        includes: t,
        // ES-Harmony
        indexOf: j,
        lastIndexOf: j,
        localeCompare: t,
        match: t,
        normalize: t,
        // ES-Harmony
        padEnd: t,
        // ES-Harmony
        padStart: t,
        // ES-Harmony
        repeat: t,
        // ES-Harmony
        replace: t,
        search: t,
        slice: j,
        split: t,
        startsWith: j,
        // ES-Harmony
        substring: t,
        toLocaleLowerCase: t,
        toLocaleUpperCase: t,
        toLowerCase: t,
        toUpperCase: t,
        trim: t,
        // B.2.3
        substr: t,
        anchor: t,
        big: t,
        blink: t,
        bold: t,
        fixed: t,
        fontcolor: t,
        fontsize: t,
        italics: t,
        link: t,
        small: t,
        strike: t,
        sub: t,
        sup: t,
        trimLeft: t,
        // non-standard
        trimRight: t,
        // non-standard
        // 21.1.4 instances
        length: '*'
      }
    },
    RegExp: {
      // 21.2
      prototype: {
        exec: t,
        flags: 'maybeAccessor',
        global: 'maybeAccessor',
        ignoreCase: 'maybeAccessor',
        [Symbol.match]: '*',
        // ES-Harmony
        multiline: 'maybeAccessor',
        [Symbol.replace]: '*',
        // ES-Harmony
        [Symbol.search]: '*',
        // ES-Harmony
        source: 'maybeAccessor',
        [Symbol.split]: '*',
        // ES-Harmony
        sticky: 'maybeAccessor',
        test: t,
        unicode: 'maybeAccessor',
        // ES-Harmony
        dotAll: 'maybeAccessor',
        // proposed ES-Harmony
        // B.2.5
        compile: false,
        // UNSAFE. Purposely suppressed
        // 21.2.6 instances
        lastIndex: '*',
        options: '*' // non-std

      }
    },
    // 22 Indexed Collections
    Array: {
      // 22.1
      from: j,
      isArray: t,
      of: j,
      // ES-Harmony?
      prototype: {
        concat: t,
        copyWithin: t,
        // ES-Harmony
        entries: t,
        // ES-Harmony
        every: t,
        fill: t,
        // ES-Harmony
        filter: j,
        find: t,
        // ES-Harmony
        findIndex: t,
        // ES-Harmony
        forEach: j,
        includes: t,
        // ES-Harmony
        indexOf: j,
        join: t,
        keys: t,
        // ES-Harmony
        lastIndexOf: j,
        map: j,
        pop: j,
        push: j,
        reduce: j,
        reduceRight: j,
        reverse: t,
        shift: j,
        slice: j,
        some: t,
        sort: t,
        splice: t,
        unshift: j,
        values: t,
        // ES-Harmony
        // 22.1.4 instances
        length: '*'
      }
    },
    // 22.2 Typed Array stuff
    // TODO: Not yet organized according to spec order
    Int8Array: TypedArrayWhitelist,
    Uint8Array: TypedArrayWhitelist,
    Uint8ClampedArray: TypedArrayWhitelist,
    Int16Array: TypedArrayWhitelist,
    Uint16Array: TypedArrayWhitelist,
    Int32Array: TypedArrayWhitelist,
    Uint32Array: TypedArrayWhitelist,
    Float32Array: TypedArrayWhitelist,
    Float64Array: TypedArrayWhitelist,
    // 23 Keyed Collections          all ES-Harmony
    Map: {
      // 23.1
      prototype: {
        clear: j,
        delete: j,
        entries: j,
        forEach: j,
        get: j,
        has: j,
        keys: j,
        set: j,
        size: 'maybeAccessor',
        values: j
      }
    },
    Set: {
      // 23.2
      prototype: {
        add: j,
        clear: j,
        delete: j,
        entries: j,
        forEach: j,
        has: j,
        keys: j,
        size: 'maybeAccessor',
        values: j
      }
    },
    WeakMap: {
      // 23.3
      prototype: {
        // Note: coordinate this list with maintenance of repairES5.js
        delete: j,
        get: j,
        has: j,
        set: j
      }
    },
    WeakSet: {
      // 23.4
      prototype: {
        add: j,
        delete: j,
        has: j
      }
    },
    // 24 Structured Data
    ArrayBuffer: {
      // 24.1            all ES-Harmony
      isView: t,
      length: t,
      // does not inherit from Function.prototype on Chrome
      name: t,
      // ditto
      prototype: {
        byteLength: 'maybeAccessor',
        slice: t
      }
    },
    // 24.2 TODO: Omitting SharedArrayBuffer for now
    DataView: {
      // 24.3               all ES-Harmony
      length: t,
      // does not inherit from Function.prototype on Chrome
      name: t,
      // ditto
      BYTES_PER_ELEMENT: '*',
      // non-standard. really?
      prototype: {
        buffer: 'maybeAccessor',
        byteOffset: 'maybeAccessor',
        byteLength: 'maybeAccessor',
        getFloat32: t,
        getFloat64: t,
        getInt8: t,
        getInt16: t,
        getInt32: t,
        getUint8: t,
        getUint16: t,
        getUint32: t,
        setFloat32: t,
        setFloat64: t,
        setInt8: t,
        setInt16: t,
        setInt32: t,
        setUint8: t,
        setUint16: t,
        setUint32: t
      }
    },
    // 24.4 TODO: Omitting Atomics for now
    JSON: {
      // 24.5
      parse: j,
      stringify: j
    },
    // 25 Control Abstraction Objects
    Promise: {
      // 25.4
      all: j,
      race: j,
      reject: j,
      resolve: j,
      prototype: {
        catch: t,
        then: j,
        finally: t,
        // proposed ES-Harmony
        // nanoq.js
        get: t,
        put: t,
        del: t,
        post: t,
        invoke: t,
        fapply: t,
        fcall: t,
        // Temporary compat with the old makeQ.js
        send: t,
        delete: t,
        end: t
      }
    },
    // nanoq.js
    Q: {
      all: t,
      race: t,
      reject: t,
      resolve: t,
      join: t,
      isPassByCopy: t,
      passByCopy: t,
      makeRemote: t,
      makeFar: t,
      // Temporary compat with the old makeQ.js
      shorten: t,
      isPromise: t,
      async: t,
      rejected: t,
      promise: t,
      delay: t,
      memoize: t,
      defer: t
    },
    // 26 Reflection
    Reflect: {
      // 26.1
      apply: t,
      construct: t,
      defineProperty: t,
      deleteProperty: t,
      get: t,
      getOwnPropertyDescriptor: t,
      getPrototypeOf: t,
      has: t,
      isExtensible: t,
      ownKeys: t,
      preventExtensions: t,
      set: t,
      setPrototypeOf: t
    },
    Proxy: {
      // 26.2
      revocable: t
    },
    // Appendix B
    // B.2.1
    escape: t,
    unescape: t,
    // B.2.5 (RegExp.prototype.compile) is marked 'false' up in 21.2
    // Other
    StringMap: {
      // A specialized approximation of ES-Harmony's Map.
      prototype: {} // Technically, the methods should be on the prototype,
      // but doing so while preserving encapsulation will be
      // needlessly expensive for current usage.

    },
    Realm: {
      makeRootRealm: t,
      makeCompartment: t,
      prototype: {
        global: 'maybeAccessor',
        evaluate: t
      }
    },
    SES: {
      confine: t,
      confineExpr: t
    },
    Nat: j,
    def: j
  }
};

function makeConsole(parentConsole) {
  /* 'parentConsole' is the parent Realm's original 'console' object. We must
     wrap it, exposing a 'console' with a 'console.log' (and perhaps others)
     to the local realm, without allowing access to the original 'console',
     its return values, or its exception objects, any of which could be used
     to break confinement via the unsafe Function constructor. */
  // callAndWrapError is copied from proposal-realms/shim/src/realmFacade.js
  // Like Realm.apply except that it catches anything thrown and rethrows it
  // as an Error from this realm
  const errorConstructors = new Map([['EvalError', EvalError], ['RangeError', RangeError], ['ReferenceError', ReferenceError], ['SyntaxError', SyntaxError], ['TypeError', TypeError], ['URIError', URIError]]);

  function callAndWrapError(target, ...args) {
    try {
      return target(...args);
    } catch (err) {
      if (Object(err) !== err) {
        // err is a primitive value, which is safe to rethrow
        throw err;
      }

      let eName;
      let eMessage;
      let eStack;

      try {
        // The child environment might seek to use 'err' to reach the
        // parent's intrinsics and corrupt them. `${err.name}` will cause
        // string coercion of 'err.name'. If err.name is an object (probably
        // a String of the parent Realm), the coercion uses
        // err.name.toString(), which is under the control of the parent. If
        // err.name were a primitive (e.g. a number), it would use
        // Number.toString(err.name), using the child's version of Number
        // (which the child could modify to capture its argument for later
        // use), however primitives don't have properties like .prototype so
        // they aren't useful for an attack.
        eName = `${err.name}`;
        eMessage = `${err.message}`;
        eStack = `${err.stack}`; // eName/eMessage/eStack are now child-realm primitive strings, and
        // safe to expose
      } catch (ignored) {
        // if err.name.toString() throws, keep the (parent realm) Error away
        // from the child
        throw new Error('unknown error');
      }

      const ErrorConstructor = errorConstructors.get(eName) || Error;

      try {
        throw new ErrorConstructor(eMessage);
      } catch (err2) {
        err2.stack = eStack; // replace with the captured inner stack

        throw err2;
      }
    }
  }

  const newConsole = {};
  const passThrough = ['log', 'info', 'warn', 'error', 'group', 'groupEnd', 'trace', 'time', 'timeLog', 'timeEnd']; // TODO: those are the properties that MDN documents. Node.js has a bunch
  // of additional ones that I didn't include, which might be appropriate.

  passThrough.forEach(name => {
    // TODO: do we reveal the presence/absence of these properties to the
    // child realm, thus exposing nondeterminism (and a hint of what platform
    // you might be on) when it is constructed with {consoleMode: allow} ? Or
    // should we expose the same set all the time, but silently ignore calls
    // to the missing ones, to hide that variation? We might even consider
    // adding console.* to the child realm all the time, even without
    // consoleMode:allow, but ignore the calls unless the mode is enabled.
    if (name in parentConsole) {
      const orig = parentConsole[name]; // TODO: in a stack trace, this appears as
      // "Object.newConsole.(anonymous function) [as trace]"
      // can we make that "newConsole.trace" ?

      newConsole[name] = function newerConsole(...args) {
        callAndWrapError(orig, ...args);
      };
    }
  });
  return newConsole;
}

function makeMakeRequire(r, harden) {
  function makeRequire(config) {
    const cache = new Map();

    function build(what) {
      // This approach denies callers the ability to use inheritance to
      // manage their config objects, but a simple "if (what in config)"
      // predicate would also be truthy for e.g. "toString" and other
      // properties of Object.prototype, and require('toString') should be
      // legal if and only if the config object included an own-property
      // named 'toString'. Incidentally, this could have been
      // "config.hasOwnProperty(what)" but eslint complained.
      if (!Object.prototype.hasOwnProperty.call(config, what)) {
        throw new Error(`Cannot find module '${what}'`);
      }

      const c = config[what]; // some modules are hard-coded ways to access functionality that SES
      // provides directly

      if (what === '@agoric/harden') {
        return harden;
      } // If the config points at a simple function, it must be a pure
      // function with no dependencies (i.e. no 'require' or 'import', no
      // calls to other functions defined in the same file but outside the
      // function body). We stringify it and evaluate it inside this realm.


      if (typeof c === 'function') {
        return r.evaluate(`(${c})`);
      } // else we treat it as an object with an 'attenuatorSource' property
      // that defines an attenuator function, which we evaluate. We then
      // invoke it with the config object, which can contain authorities that
      // it can wrap. The return value from this invocation is the module
      // object that gets returned from require(). The attenuator function
      // and the module it returns are in-realm, the authorities it wraps
      // will be out-of-realm.


      const src = `(${c.attenuatorSource})`;
      const attenuator = r.evaluate(src);
      return attenuator(c);
    }

    function newRequire(whatArg) {
      const what = `${whatArg}`;

      if (!cache.has(what)) {
        cache.set(what, harden(build(what)));
      }

      return cache.get(what);
    }

    return newRequire;
  }

  return makeRequire;
} // Copyright (C) 2018 Agoric


function createSESWithRealmConstructor(creatorStrings, Realm) {
  function makeSESRootRealm(options) {
    // eslint-disable-next-line no-param-reassign
    options = Object(options); // Todo: sanitize

    const shims = [];
    const wl = JSON.parse(JSON.stringify(options.whitelist || whitelist)); // "allow" enables real Date.now(), anything else gets NaN
    // (it'd be nice to allow a fixed numeric value, but too hard to
    // implement right now)

    if (options.dateNowMode !== 'allow') {
      shims.push(`(${tameDate})();`);
    }

    if (options.mathRandomMode !== 'allow') {
      shims.push(`(${tameMath})();`);
    } // Intl is disabled entirely for now, deleted by removeProperties. If we
    // want to bring it back (under the control of this option), we'll need
    // to add it to the whitelist too, as well as taming it properly.


    if (options.intlMode !== 'allow') {
      // this shim also disables Object.prototype.toLocaleString
      shims.push(`(${tameIntl})();`);
    }

    if (options.errorStackMode !== 'allow') {
      shims.push(`(${tameError})();`);
    } else {
      // if removeProperties cleans these things from Error, v8 won't provide
      // stack traces or even toString on exceptions, and then Node.js prints
      // uncaught exceptions as "undefined" instead of a type/message/stack.
      // So if we're allowing stack traces, make sure the whitelist is
      // augmented to include them.
      wl.namedIntrinsics.Error.captureStackTrace = true;
      wl.namedIntrinsics.Error.stackTraceLimit = true;
      wl.namedIntrinsics.Error.prepareStackTrace = true;
    }

    if (options.regexpMode !== 'allow') {
      shims.push(`(${tameRegExp})();`);
    } // The getAnonIntrinsics function might be renamed by e.g. rollup. The
    // removeProperties() function references it by name, so we need to force
    // it to have a specific name.


    const removeProp = `const getAnonIntrinsics = (${getAnonIntrinsics$1});
               (${removeProperties})(this, ${JSON.stringify(wl)})`;
    shims.push(removeProp);
    const r = Realm.makeRootRealm({
      shims
    }); // Build a harden() with an empty fringe. It will be populated later when
    // we call harden(allIntrinsics).

    const makeHardenerSrc = `(${_makeHardener.default})`;
    const harden = r.evaluate(makeHardenerSrc)(undefined, options.hardenerOptions);
    const b = r.evaluate(creatorStrings);
    b.createSESInThisRealm(r.global, creatorStrings, r); // b.removeProperties(r.global);

    if (options.consoleMode === 'allow') {
      const s = `(${makeConsole})`;
      r.global.console = r.evaluate(s)(console);
    } // Finally freeze all the primordials, and the global object. This must
    // be the last thing we do that modifies the Realm's globals.


    const anonIntrinsics = r.evaluate(`(${getAnonIntrinsics$1})`)(r.global);
    const allIntrinsics = r.evaluate(`(${getAllPrimordials})`)(r.global, anonIntrinsics);
    harden(allIntrinsics); // build the makeRequire helper, glue it to the new Realm

    r.makeRequire = harden(r.evaluate(`(${makeMakeRequire})`)(r, harden));
    return r;
  }

  const SES = {
    makeSESRootRealm
  };
  return SES;
} // Copyright (C) 2018 Agoric


const creatorStrings = "(function (exports) {\n  'use strict';\n\n  // Adapted from SES/Caja - Copyright (C) 2011 Google Inc.\n  // Copyright (C) 2018 Agoric\n\n  // Licensed under the Apache License, Version 2.0 (the \"License\");\n  // you may not use this file except in compliance with the License.\n  // You may obtain a copy of the License at\n  //\n  // http://www.apache.org/licenses/LICENSE-2.0\n  //\n  // Unless required by applicable law or agreed to in writing, software\n  // distributed under the License is distributed on an \"AS IS\" BASIS,\n  // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n  // See the License for the specific language governing permissions and\n  // limitations under the License.\n\n  // based upon:\n  // https://github.com/google/caja/blob/master/src/com/google/caja/ses/startSES.js\n  // https://github.com/google/caja/blob/master/src/com/google/caja/ses/repairES5.js\n  // then copied from proposal-frozen-realms deep-freeze.js\n  // then copied from SES/src/bundle/deepFreeze.js\n\n  /**\n   * @typedef HardenerOptions\n   * @type {object}\n   * @property {WeakSet=} fringeSet WeakSet to use for the fringeSet\n   * @property {Function=} naivePrepareObject Call with object before hardening\n   */\n\n  /**\n   * Create a `harden` function.\n   *\n   * @param {Iterable} initialFringe Objects considered already hardened\n   * @param {HardenerOptions=} options Options for creation\n   */\n  function makeHardener(initialFringe, options = {}) {\n    const { freeze, getOwnPropertyDescriptors, getPrototypeOf } = Object;\n    const { ownKeys } = Reflect;\n\n    // Objects that we won't freeze, either because we've frozen them already,\n    // or they were one of the initial roots (terminals). These objects form\n    // the \"fringe\" of the hardened object graph.\n    let { fringeSet } = options;\n    if (fringeSet) {\n      if (\n        typeof fringeSet.add !== 'function' ||\n        typeof fringeSet.has !== 'function'\n      ) {\n        throw new TypeError(\n          `options.fringeSet must have add() and has() methods`,\n        );\n      }\n\n      // Populate the supplied fringeSet with our initialFringe.\n      if (initialFringe) {\n        for (const fringe of initialFringe) {\n          fringeSet.add(fringe);\n        }\n      }\n    } else {\n      // Use a new empty fringe.\n      fringeSet = new WeakSet(initialFringe);\n    }\n\n    const naivePrepareObject = options && options.naivePrepareObject;\n\n    function harden(root) {\n      const toFreeze = new Set();\n      const prototypes = new Map();\n      const paths = new WeakMap();\n\n      // If val is something we should be freezing but aren't yet,\n      // add it to toFreeze.\n      function enqueue(val, path) {\n        if (Object(val) !== val) {\n          // ignore primitives\n          return;\n        }\n        const type = typeof val;\n        if (type !== 'object' && type !== 'function') {\n          // future proof: break until someone figures out what it should do\n          throw new TypeError(`Unexpected typeof: ${type}`);\n        }\n        if (fringeSet.has(val) || toFreeze.has(val)) {\n          // Ignore if this is an exit, or we've already visited it\n          return;\n        }\n        // console.log(`adding ${val} to toFreeze`, val);\n        toFreeze.add(val);\n        paths.set(val, path);\n      }\n\n      function freezeAndTraverse(obj) {\n        // Apply the naive preparer if they specified one.\n        if (naivePrepareObject) {\n          naivePrepareObject(obj);\n        }\n\n        // Now freeze the object to ensure reactive\n        // objects such as proxies won't add properties\n        // during traversal, before they get frozen.\n\n        // Object are verified before being enqueued,\n        // therefore this is a valid candidate.\n        // Throws if this fails (strict mode).\n        freeze(obj);\n\n        // we rely upon certain commitments of Object.freeze and proxies here\n\n        // get stable/immutable outbound links before a Proxy has a chance to do\n        // something sneaky.\n        const proto = getPrototypeOf(obj);\n        const descs = getOwnPropertyDescriptors(obj);\n        const path = paths.get(obj) || 'unknown';\n\n        // console.log(`adding ${proto} to prototypes under ${path}`);\n        if (proto !== null && !prototypes.has(proto)) {\n          prototypes.set(proto, path);\n          paths.set(proto, `${path}.__proto__`);\n        }\n\n        ownKeys(descs).forEach(name => {\n          const pathname = `${path}.${String(name)}`;\n          // todo uncurried form\n          // todo: getOwnPropertyDescriptors is guaranteed to return well-formed\n          // descriptors, but they still inherit from Object.prototype. If\n          // someone has poisoned Object.prototype to add 'value' or 'get'\n          // properties, then a simple 'if (\"value\" in desc)' or 'desc.value'\n          // test could be confused. We use hasOwnProperty to be sure about\n          // whether 'value' is present or not, which tells us for sure that this\n          // is a data property.\n          const desc = descs[name];\n          if ('value' in desc) {\n            // todo uncurried form\n            enqueue(desc.value, `${pathname}`);\n          } else {\n            enqueue(desc.get, `${pathname}(get)`);\n            enqueue(desc.set, `${pathname}(set)`);\n          }\n        });\n      }\n\n      function dequeue() {\n        // New values added before forEach() has finished will be visited.\n        toFreeze.forEach(freezeAndTraverse); // todo curried forEach\n      }\n\n      function checkPrototypes() {\n        prototypes.forEach((path, p) => {\n          if (!(toFreeze.has(p) || fringeSet.has(p))) {\n            // all reachable properties have already been frozen by this point\n            let msg;\n            try {\n              msg = `prototype ${p} of ${path} is not already in the fringeSet`;\n            } catch (e) {\n              // `${(async _=>_).__proto__}` fails in most engines\n              msg =\n                'a prototype of something is not already in the fringeset (and .toString failed)';\n              try {\n                console.log(msg);\n                console.log('the prototype:', p);\n                console.log('of something:', path);\n              } catch (_e) {\n                // console.log might be missing in restrictive SES realms\n              }\n            }\n            throw new TypeError(msg);\n          }\n        });\n      }\n\n      function commit() {\n        // todo curried forEach\n        // we capture the real WeakSet.prototype.add above, in case someone\n        // changes it. The two-argument form of forEach passes the second\n        // argument as the 'this' binding, so we add to the correct set.\n        toFreeze.forEach(fringeSet.add, fringeSet);\n      }\n\n      enqueue(root);\n      dequeue();\n      // console.log(\"fringeSet\", fringeSet);\n      // console.log(\"prototype set:\", prototypes);\n      // console.log(\"toFreeze set:\", toFreeze);\n      checkPrototypes();\n      commit();\n\n      return root;\n    }\n\n    return harden;\n  }\n\n  function tameDate() {\n    const unsafeDate = Date;\n    // Date(anything) gives a string with the current time\n    // new Date(x) coerces x into a number and then returns a Date\n    // new Date() returns the current time, as a Date object\n    // new Date(undefined) returns a Date object which stringifies to 'Invalid Date'\n\n    const newDateConstructor = function Date(...args) {\n      if (new.target === undefined) {\n        // we were not called as a constructor\n        // this would normally return a string with the current time\n        return 'Invalid Date';\n      }\n      // constructor behavior: if we get arguments, we can safely pass them through\n      if (args.length > 0) {\n        return Reflect.construct(unsafeDate, args, new.target);\n        // todo: test that our constructor can still be subclassed\n      }\n      // no arguments: return a Date object, but invalid\n      return Reflect.construct(unsafeDate, [NaN], new.target);\n    };\n\n    Object.defineProperties(\n      newDateConstructor,\n      Object.getOwnPropertyDescriptors(unsafeDate),\n    );\n    // that will copy the .prototype too, so this next line is unnecessary\n    // newDateConstructor.prototype = unsafeDate.prototype;\n    unsafeDate.prototype.constructor = newDateConstructor;\n    // disable Date.now\n    newDateConstructor.now = () => NaN;\n\n    Date = newDateConstructor; // eslint-disable-line no-global-assign\n  }\n\n  function tameMath() {\n    // Math.random = () => 4; // https://www.xkcd.com/221\n    Math.random = () => {\n      throw Error('disabled');\n    };\n  }\n\n  /* global Intl */\n\n  function tameIntl() {\n    // todo: somehow fix these. These almost certainly don't enable the reading\n    // of side-channels, but we want things to be deterministic across\n    // runtimes. Best bet is to just disallow calling these functions without\n    // an explicit locale name.\n\n    // the whitelist may have deleted Intl entirely, so tolerate that\n    if (typeof Intl !== 'undefined') {\n      Intl.DateTimeFormat = () => {\n        throw Error('disabled');\n      };\n      Intl.NumberFormat = () => {\n        throw Error('disabled');\n      };\n      Intl.getCanonicalLocales = () => {\n        throw Error('disabled');\n      };\n    }\n    // eslint-disable-next-line no-extend-native\n    Object.prototype.toLocaleString = () => {\n      throw new Error('toLocaleString suppressed');\n    };\n  }\n\n  function tameError() {\n    if (!Object.isExtensible(Error)) {\n      throw Error('huh Error is not extensible');\n    }\n    /* this worked back when we were running it on a global, but stopped\n    working when we turned it into a shim */\n    /*\n    Object.defineProperty(Error.prototype, \"stack\",\n                          { get() { return 'stack suppressed'; } });\n    */\n    delete Error.captureStackTrace;\n    if ('captureStackTrace' in Error) {\n      throw Error('hey we could not remove Error.captureStackTrace');\n    }\n\n    // we might do this in the future\n    /*\n    const unsafeError = Error;\n    const newErrorConstructor = function Error(...args) {\n      return Reflect.construct(unsafeError, args, new.target);\n    };\n\n    newErrorConstructor.prototype = unsafeError.prototype;\n    newErrorConstructor.prototype.construct = newErrorConstructor;\n\n    Error = newErrorConstructor;\n\n    EvalError.__proto__ = newErrorConstructor;\n    RangeError.__proto__ = newErrorConstructor;\n    ReferenceError.__proto__ = newErrorConstructor;\n    SyntaxError.__proto__ = newErrorConstructor;\n    TypeError.__proto__ = newErrorConstructor;\n    URIError.__proto__ = newErrorConstructor;\n    */\n  }\n\n  function tameRegExp() {\n    delete RegExp.prototype.compile;\n    if ('compile' in RegExp.prototype) {\n      throw Error('hey we could not remove RegExp.prototype.compile');\n    }\n\n    // We want to delete RegExp.$1, as well as any other surprising properties.\n    // On some engines we can't just do 'delete RegExp.$1'.\n    const unsafeRegExp = RegExp;\n\n    // eslint-disable-next-line no-global-assign\n    RegExp = function RegExp(...args) {\n      return Reflect.construct(unsafeRegExp, args, new.target);\n    };\n    RegExp.prototype = unsafeRegExp.prototype;\n    unsafeRegExp.prototype.constructor = RegExp;\n\n    if ('$1' in RegExp) {\n      throw Error('hey we could not remove RegExp.$1');\n    }\n  }\n\n  /* global getAnonIntrinsics */\n\n  // Copyright (C) 2011 Google Inc.\n  // Copyright (C) 2018 Agoric\n  //\n  // Licensed under the Apache License, Version 2.0 (the \"License\");\n  // you may not use this file except in compliance with the License.\n  // You may obtain a copy of the License at\n  //\n  // http://www.apache.org/licenses/LICENSE-2.0\n  //\n  // Unless required by applicable law or agreed to in writing, software\n  // distributed under the License is distributed on an \"AS IS\" BASIS,\n  // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n  // See the License for the specific language governing permissions and\n  // limitations under the License.\n\n  /* This is evaluated in an environment in which getAnonIntrinsics() is\n     already defined (by prepending the definition of getAnonIntrinsics to the\n     stringified removeProperties()), hence we don't use the following\n     import */\n  // import { getAnonIntrinsics } from './anonIntrinsics.js';\n\n  function removeProperties(global, whitelist) {\n    // walk global object, test against whitelist, delete\n\n    const uncurryThis = fn => (thisArg, ...args) =>\n      Reflect.apply(fn, thisArg, args);\n    const {\n      getOwnPropertyDescriptor: gopd,\n      getOwnPropertyNames: gopn,\n      keys,\n    } = Object;\n    const cleaning = new WeakMap();\n    const getProto = Object.getPrototypeOf;\n    const hop = uncurryThis(Object.prototype.hasOwnProperty);\n\n    const whiteTable = new WeakMap();\n\n    function addToWhiteTable(rootValue, rootPermit) {\n      /**\n       * The whiteTable should map from each path-accessible primordial\n       * object to the permit object that describes how it should be\n       * cleaned.\n       *\n       * We initialize the whiteTable only so that {@code getPermit} can\n       * process \"*\" inheritance using the whitelist, by walking actual\n       * inheritance chains.\n       */\n      const whitelistSymbols = [true, false, '*', 'maybeAccessor'];\n      function register(value, permit) {\n        if (value !== Object(value)) {\n          return;\n        }\n        if (typeof permit !== 'object') {\n          if (whitelistSymbols.indexOf(permit) < 0) {\n            throw new Error(\n              `syntax error in whitelist; unexpected value: ${permit}`,\n            );\n          }\n          return;\n        }\n        if (whiteTable.has(value)) {\n          throw new Error('primordial reachable through multiple paths');\n        }\n        whiteTable.set(value, permit);\n        keys(permit).forEach(name => {\n          // Use gopd to avoid invoking an accessor property.\n          // Accessor properties for which permit !== 'maybeAccessor'\n          // are caught later by clean().\n          const desc = gopd(value, name);\n          if (desc) {\n            register(desc.value, permit[name]);\n          }\n        });\n      }\n      register(rootValue, rootPermit);\n    }\n\n    /**\n     * Should the property named {@code name} be whitelisted on the\n     * {@code base} object, and if so, with what Permit?\n     *\n     * <p>If it should be permitted, return the Permit (where Permit =\n     * true | \"maybeAccessor\" | \"*\" | Record(Permit)), all of which are\n     * truthy. If it should not be permitted, return false.\n     */\n    function getPermit(base, name) {\n      let permit = whiteTable.get(base);\n      if (permit) {\n        if (hop(permit, name)) {\n          return permit[name];\n        }\n      }\n      // eslint-disable-next-line no-constant-condition\n      while (true) {\n        base = getProto(base); // eslint-disable-line no-param-reassign\n        if (base === null) {\n          return false;\n        }\n        permit = whiteTable.get(base);\n        if (permit && hop(permit, name)) {\n          const result = permit[name];\n          if (result === '*') {\n            return result;\n          }\n          return false;\n        }\n      }\n    }\n\n    /**\n     * Removes all non-whitelisted properties found by recursively and\n     * reflectively walking own property chains.\n     *\n     * <p>Inherited properties are not checked, because we require that\n     * inherited-from objects are otherwise reachable by this traversal.\n     */\n    function clean(value, prefix, num) {\n      if (value !== Object(value)) {\n        return;\n      }\n      if (cleaning.get(value)) {\n        return;\n      }\n\n      const proto = getProto(value);\n      if (proto !== null && !whiteTable.has(proto)) {\n        // reportItemProblem(rootReports, ses.severities.NOT_ISOLATED,\n        //                  'unexpected intrinsic', prefix + '.__proto__');\n        throw new Error(`unexpected intrinsic ${prefix}.__proto__`);\n      }\n\n      cleaning.set(value, true);\n      gopn(value).forEach(name => {\n        const path = prefix + (prefix ? '.' : '') + name;\n        const p = getPermit(value, name);\n        if (p) {\n          const desc = gopd(value, name);\n          if (hop(desc, 'value')) {\n            // Is a data property\n            const subValue = desc.value;\n            clean(subValue, path, num + 1);\n          } else if (p !== 'maybeAccessor') {\n            // We are not saying that it is safe for the prop to be\n            // unexpectedly an accessor; rather, it will be deleted\n            // and thus made safe.\n            // reportProperty(ses.severities.SAFE_SPEC_VIOLATION,\n            //               'Not a data property', path);\n            delete value[name]; // eslint-disable-line no-param-reassign\n          } else {\n            clean(desc.get, `${path}<getter>`, num + 1);\n            clean(desc.set, `${path}<setter>`, num + 1);\n          }\n        } else {\n          delete value[name]; // eslint-disable-line no-param-reassign\n        }\n      });\n    }\n\n    addToWhiteTable(global, whitelist.namedIntrinsics);\n    const intr = getAnonIntrinsics(global);\n    addToWhiteTable(intr, whitelist.anonIntrinsics);\n    clean(global, '', 0);\n  }\n\n  // Copyright (C) 2011 Google Inc.\n  // Copyright (C) 2018 Agoric\n  //\n  // Licensed under the Apache License, Version 2.0 (the \"License\");\n  // you may not use this file except in compliance with the License.\n  // You may obtain a copy of the License at\n  //\n  // https://www.apache.org/licenses/LICENSE-2.0\n  //\n  // Unless required by applicable law or agreed to in writing, software\n  // distributed under the License is distributed on an \"AS IS\" BASIS,\n  // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n  // See the License for the specific language governing permissions and\n  // limitations under the License.\n\n  // TODO(erights): We should test for\n  // We now have a reason to omit Proxy from the whitelist.\n  // The makeBrandTester in repairES5 uses Allen's trick at\n  // https://esdiscuss.org/topic/tostringtag-spoofing-for-null-and-undefined#content-59\n  // , but testing reveals that, on FF 35.0.1, a proxy on an exotic\n  // object X will pass this brand test when X will. This is fixed as of\n  // FF Nightly 38.0a1.\n\n  /**\n   * <p>Qualifying platforms generally include all JavaScript platforms\n   * shown on <a href=\"http://kangax.github.com/es5-compat-table/\"\n   * >ECMAScript 5 compatibility table</a> that implement {@code\n   * Object.getOwnPropertyNames}. At the time of this writing,\n   * qualifying browsers already include the latest released versions of\n   * Internet Explorer (9), Firefox (4), Chrome (11), and Safari\n   * (5.0.5), their corresponding standalone (e.g., server-side) JavaScript\n   * engines, Rhino 1.73, and BESEN.\n   *\n   * <p>On such not-quite-ES5 platforms, some elements of these\n   * emulations may lose SES safety, as enumerated in the comment on\n   * each problem record in the {@code baseProblems} and {@code\n   * supportedProblems} array below. The platform must at least provide\n   * {@code Object.getOwnPropertyNames}, because it cannot reasonably be\n   * emulated.\n   *\n   * <p>This file is useful by itself, as it has no dependencies on the\n   * rest of SES. It creates no new global bindings, but merely repairs\n   * standard globals or standard elements reachable from standard\n   * globals. If the future-standard {@code WeakMap} global is present,\n   * as it is currently on FF7.0a1, then it will repair it in place. The\n   * one non-standard element that this file uses is {@code console} if\n   * present, in order to report the repairs it found necessary, in\n   * which case we use its {@code log, info, warn}, and {@code error}\n   * methods. If {@code console.log} is absent, then this file performs\n   * its repairs silently.\n   *\n   * <p>Generally, this file should be run as the first script in a\n   * JavaScript context (i.e. a browser frame), as it relies on other\n   * primordial objects and methods not yet being perturbed.\n   *\n   * <p>TODO(erights): This file tries to protect itself from some\n   * post-initialization perturbation by stashing some of the\n   * primordials it needs for later use, but this attempt is currently\n   * incomplete. We need to revisit this when we support Confined-ES5,\n   * as a variant of SES in which the primordials are not frozen. See\n   * previous failed attempt at <a\n   * href=\"https://codereview.appspot.com/5278046/\" >Speeds up\n   * WeakMap. Preparing to support unfrozen primordials.</a>. From\n   * analysis of this failed attempt, it seems that the only practical\n   * way to support CES is by use of two frames, where most of initSES\n   * runs in a SES frame, and so can avoid worrying about most of these\n   * perturbations.\n   */\n  function getAnonIntrinsics$1(global) {\n\n    const gopd = Object.getOwnPropertyDescriptor;\n    const getProto = Object.getPrototypeOf;\n\n    // ////////////// Undeniables and Intrinsics //////////////\n\n    /**\n     * The undeniables are the primordial objects which are ambiently\n     * reachable via compositions of strict syntax, primitive wrapping\n     * (new Object(x)), and prototype navigation (the equivalent of\n     * Object.getPrototypeOf(x) or x.__proto__). Although we could in\n     * theory monkey patch primitive wrapping or prototype navigation,\n     * we won't. Hence, without parsing, the following are undeniable no\n     * matter what <i>other</i> monkey patching we do to the primordial\n     * environment.\n     */\n\n    // The first element of each undeniableTuple is a string used to\n    // name the undeniable object for reporting purposes. It has no\n    // other programmatic use.\n    //\n    // The second element of each undeniableTuple should be the\n    // undeniable itself.\n    //\n    // The optional third element of the undeniableTuple, if present,\n    // should be an example of syntax, rather than use of a monkey\n    // patchable API, evaluating to a value from which the undeniable\n    // object in the second element can be reached by only the\n    // following steps:\n    // If the value is primitve, convert to an Object wrapper.\n    // Is the resulting object either the undeniable object, or does\n    // it inherit directly from the undeniable object?\n\n    function* aStrictGenerator() {} // eslint-disable-line no-empty-function\n    const Generator = getProto(aStrictGenerator);\n    async function* aStrictAsyncGenerator() {} // eslint-disable-line no-empty-function\n    const AsyncGenerator = getProto(aStrictAsyncGenerator);\n    async function aStrictAsyncFunction() {} // eslint-disable-line no-empty-function\n    const AsyncFunctionPrototype = getProto(aStrictAsyncFunction);\n\n    // TODO: this is dead code, but could be useful: make this the\n    // 'undeniables' object available via some API.\n\n    const undeniableTuples = [\n      ['Object.prototype', Object.prototype, {}],\n      ['Function.prototype', Function.prototype, function foo() {}],\n      ['Array.prototype', Array.prototype, []],\n      ['RegExp.prototype', RegExp.prototype, /x/],\n      ['Boolean.prototype', Boolean.prototype, true],\n      ['Number.prototype', Number.prototype, 1],\n      ['String.prototype', String.prototype, 'x'],\n      ['%Generator%', Generator, aStrictGenerator],\n      ['%AsyncGenerator%', AsyncGenerator, aStrictAsyncGenerator],\n      ['%AsyncFunction%', AsyncFunctionPrototype, aStrictAsyncFunction],\n    ];\n\n    undeniableTuples.forEach(tuple => {\n      const name = tuple[0];\n      const undeniable = tuple[1];\n      let start = tuple[2];\n      if (start === undefined) {\n        return;\n      }\n      start = Object(start);\n      if (undeniable === start) {\n        return;\n      }\n      if (undeniable === getProto(start)) {\n        return;\n      }\n      throw new Error(`Unexpected undeniable: ${undeniable}`);\n    });\n\n    function registerIteratorProtos(registery, base, name) {\n      const iteratorSym =\n        (global.Symbol && global.Symbol.iterator) || '@@iterator'; // used instead of a symbol on FF35\n\n      if (base[iteratorSym]) {\n        const anIter = base[iteratorSym]();\n        const anIteratorPrototype = getProto(anIter);\n        registery[name] = anIteratorPrototype; // eslint-disable-line no-param-reassign\n        const anIterProtoBase = getProto(anIteratorPrototype);\n        if (anIterProtoBase !== Object.prototype) {\n          if (!registery.IteratorPrototype) {\n            if (getProto(anIterProtoBase) !== Object.prototype) {\n              throw new Error(\n                '%IteratorPrototype%.__proto__ was not Object.prototype',\n              );\n            }\n            registery.IteratorPrototype = anIterProtoBase; // eslint-disable-line no-param-reassign\n          } else if (registery.IteratorPrototype !== anIterProtoBase) {\n            throw new Error(`unexpected %${name}%.__proto__`);\n          }\n        }\n      }\n    }\n\n    /**\n     * Get the intrinsics not otherwise reachable by named own property\n     * traversal. See\n     * https://people.mozilla.org/~jorendorff/es6-draft.html#sec-well-known-intrinsic-objects\n     * and the instrinsics section of whitelist.js\n     *\n     * <p>Unlike getUndeniables(), the result of sampleAnonIntrinsics()\n     * does depend on the current state of the primordials, so we must\n     * run this again after all other relevant monkey patching is done,\n     * in order to properly initialize cajaVM.intrinsics\n     */\n\n    // TODO: we can probably unwrap this into the outer function, and stop\n    // using a separately named 'sampleAnonIntrinsics'\n    function sampleAnonIntrinsics() {\n      const result = {};\n\n      // If there are still other ThrowTypeError objects left after\n      // noFuncPoison-ing, this should be caught by\n      // test_THROWTYPEERROR_NOT_UNIQUE below, so we assume here that\n      // this is the only surviving ThrowTypeError intrinsic.\n      // eslint-disable-next-line prefer-rest-params\n      result.ThrowTypeError = gopd(arguments, 'callee').get;\n\n      // Get the ES6 %ArrayIteratorPrototype%,\n      // %StringIteratorPrototype%, %MapIteratorPrototype%,\n      // %SetIteratorPrototype% and %IteratorPrototype% intrinsics, if\n      // present.\n      registerIteratorProtos(result, [], 'ArrayIteratorPrototype');\n      registerIteratorProtos(result, '', 'StringIteratorPrototype');\n      if (typeof Map === 'function') {\n        registerIteratorProtos(result, new Map(), 'MapIteratorPrototype');\n      }\n      if (typeof Set === 'function') {\n        registerIteratorProtos(result, new Set(), 'SetIteratorPrototype');\n      }\n\n      // Get the ES6 %GeneratorFunction% intrinsic, if present.\n      if (getProto(Generator) !== Function.prototype) {\n        throw new Error('Generator.__proto__ was not Function.prototype');\n      }\n      const GeneratorFunction = Generator.constructor;\n      if (getProto(GeneratorFunction) !== Function.prototype.constructor) {\n        throw new Error(\n          'GeneratorFunction.__proto__ was not Function.prototype.constructor',\n        );\n      }\n      result.GeneratorFunction = GeneratorFunction;\n      const genProtoBase = getProto(Generator.prototype);\n      if (genProtoBase !== result.IteratorPrototype) {\n        throw new Error('Unexpected Generator.prototype.__proto__');\n      }\n\n      // Get the ES6 %AsyncGeneratorFunction% intrinsic, if present.\n      if (getProto(AsyncGenerator) !== Function.prototype) {\n        throw new Error('AsyncGenerator.__proto__ was not Function.prototype');\n      }\n      const AsyncGeneratorFunction = AsyncGenerator.constructor;\n      if (getProto(AsyncGeneratorFunction) !== Function.prototype.constructor) {\n        throw new Error(\n          'AsyncGeneratorFunction.__proto__ was not Function.prototype.constructor',\n        );\n      }\n      result.AsyncGeneratorFunction = AsyncGeneratorFunction;\n      const AsyncGeneratorPrototype = AsyncGenerator.prototype;\n      result.AsyncIteratorPrototype = getProto(AsyncGeneratorPrototype);\n      // it appears that the only way to get an AsyncIteratorPrototype is\n      // through this getProto() process, so there's nothing to check it\n      // against\n      if (getProto(result.AsyncIteratorPrototype) !== Object.prototype) {\n        throw new Error(\n          'AsyncIteratorPrototype.__proto__ was not Object.prototype',\n        );\n      }\n\n      // Get the ES6 %AsyncFunction% intrinsic, if present.\n      if (getProto(AsyncFunctionPrototype) !== Function.prototype) {\n        throw new Error(\n          'AsyncFunctionPrototype.__proto__ was not Function.prototype',\n        );\n      }\n      const AsyncFunction = AsyncFunctionPrototype.constructor;\n      if (getProto(AsyncFunction) !== Function.prototype.constructor) {\n        throw new Error(\n          'AsyncFunction.__proto__ was not Function.prototype.constructor',\n        );\n      }\n      result.AsyncFunction = AsyncFunction;\n\n      // Get the ES6 %TypedArray% intrinsic, if present.\n      (function getTypedArray() {\n        if (!global.Float32Array) {\n          return;\n        }\n        const TypedArray = getProto(global.Float32Array);\n        if (TypedArray === Function.prototype) {\n          return;\n        }\n        if (getProto(TypedArray) !== Function.prototype) {\n          // http://bespin.cz/~ondras/html/classv8_1_1ArrayBufferView.html\n          // has me worried that someone might make such an intermediate\n          // object visible.\n          throw new Error('TypedArray.__proto__ was not Function.prototype');\n        }\n        result.TypedArray = TypedArray;\n      })();\n\n      Object.keys(result).forEach(name => {\n        if (result[name] === undefined) {\n          throw new Error(`Malformed intrinsic: ${name}`);\n        }\n      });\n\n      return result;\n    }\n\n    return sampleAnonIntrinsics();\n  }\n\n  function getAllPrimordials(global, anonIntrinsics) {\n\n    const root = {\n      global, // global plus all the namedIntrinsics\n      anonIntrinsics,\n    };\n    // todo: re-examine exactly which \"global\" we're freezing\n\n    return root;\n  }\n\n  // Copyright (C) 2011 Google Inc.\n  // Copyright (C) 2018 Agoric\n  //\n  // Licensed under the Apache License, Version 2.0 (the \"License\");\n  // you may not use this file except in compliance with the License.\n  // You may obtain a copy of the License at\n  //\n  // http://www.apache.org/licenses/LICENSE-2.0\n  //\n  // Unless required by applicable law or agreed to in writing, software\n  // distributed under the License is distributed on an \"AS IS\" BASIS,\n  // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n  // See the License for the specific language governing permissions and\n  // limitations under the License.\n\n  /**\n   * @fileoverview Exports {@code ses.whitelist}, a recursively defined\n   * JSON record enumerating all the naming paths in the ES5.1 spec,\n   * those de-facto extensions that we judge to be safe, and SES and\n   * Dr. SES extensions provided by the SES runtime.\n   *\n   * <p>Assumes only ES3. Compatible with ES5, ES5-strict, or\n   * anticipated ES6.\n   *\n   * //provides ses.whitelist\n   * @author Mark S. Miller,\n   * @overrides ses, whitelistModule\n   */\n\n  /**\n   * <p>Each JSON record enumerates the disposition of the properties on\n   * some corresponding primordial object, with the root record\n   * representing the global object. For each such record, the values\n   * associated with its property names can be\n   * <ul>\n   * <li>Another record, in which case this property is simply\n   *     whitelisted and that next record represents the disposition of\n   *     the object which is its value. For example, {@code \"Object\"}\n   *     leads to another record explaining what properties {@code\n   *     \"Object\"} may have and how each such property, if present,\n   *     and its value should be tamed.\n   * <li>true, in which case this property is simply whitelisted. The\n   *     value associated with that property is still traversed and\n   *     tamed, but only according to the taming of the objects that\n   *     object inherits from. For example, {@code \"Object.freeze\"} leads\n   *     to true, meaning that the {@code \"freeze\"} property of {@code\n   *     Object} should be whitelisted and the value of the property (a\n   *     function) should be further tamed only according to the\n   *     markings of the other objects it inherits from, like {@code\n   *     \"Function.prototype\"} and {@code \"Object.prototype\").\n   *     If the property is an accessor property, it is not\n   *     whitelisted (as invoking an accessor might not be meaningful,\n   *     yet the accessor might return a value needing taming).\n   * <li>\"maybeAccessor\", in which case this accessor property is simply\n   *     whitelisted and its getter and/or setter are tamed according to\n   *     inheritance. If the property is not an accessor property, its\n   *     value is tamed according to inheritance.\n   * <li>\"*\", in which case this property on this object is whitelisted,\n   *     as is this property as inherited by all objects that inherit\n   *     from this object. The values associated with all such properties\n   *     are still traversed and tamed, but only according to the taming\n   *     of the objects that object inherits from. For example, {@code\n   *     \"Object.prototype.constructor\"} leads to \"*\", meaning that we\n   *     whitelist the {@code \"constructor\"} property on {@code\n   *     Object.prototype} and on every object that inherits from {@code\n   *     Object.prototype} that does not have a conflicting mark. Each\n   *     of these is tamed as if with true, so that the value of the\n   *     property is further tamed according to what other objects it\n   *     inherits from.\n   * <li>false, which suppresses permission inherited via \"*\".\n   * </ul>\n   *\n   * <p>TODO: We want to do for constructor: something weaker than '*',\n   * but rather more like what we do for [[Prototype]] links, which is\n   * that it is whitelisted only if it points at an object which is\n   * otherwise reachable by a whitelisted path.\n   *\n   * <p>The members of the whitelist are either\n   * <ul>\n   * <li>(uncommented) defined by the ES5.1 normative standard text,\n   * <li>(questionable) provides a source of non-determinism, in\n   *     violation of pure object-capability rules, but allowed anyway\n   *     since we've given up on restricting JavaScript to a\n   *     deterministic subset.\n   * <li>(ES5 Appendix B) common elements of de facto JavaScript\n   *     described by the non-normative Appendix B.\n   * <li>(Harmless whatwg) extensions documented at\n   *     <a href=\"http://wiki.whatwg.org/wiki/Web_ECMAScript\"\n   *     >http://wiki.whatwg.org/wiki/Web_ECMAScript</a> that seem to be\n   *     harmless. Note that the RegExp constructor extensions on that\n   *     page are <b>not harmless</b> and so must not be whitelisted.\n   * <li>(ES-Harmony proposal) accepted as \"proposal\" status for\n   *     EcmaScript-Harmony.\n   * </ul>\n   *\n   * <p>With the above encoding, there are some sensible whitelists we\n   * cannot express, such as marking a property both with \"*\" and a JSON\n   * record. This is an expedient decision based only on not having\n   * encountered such a need. Should we need this extra expressiveness,\n   * we'll need to refactor to enable a different encoding.\n   *\n   * <p>We factor out {@code true} into the variable {@code t} just to\n   * get a bit better compression from simple minifiers.\n   */\n\n  const t = true;\n  const j = true; // included in the Jessie runtime\n\n  let TypedArrayWhitelist; // defined and used below\n\n  var whitelist = {\n    // The accessible intrinsics which are not reachable by own\n    // property name traversal are listed here so that they are\n    // processed by the whitelist, although this also makes them\n    // accessible by this path.  See\n    // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-well-known-intrinsic-objects\n    // Of these, ThrowTypeError is the only one from ES5. All the\n    // rest were introduced in ES6.\n    anonIntrinsics: {\n      ThrowTypeError: {},\n      IteratorPrototype: {\n        // 25.1\n        // Technically, for SES-on-ES5, we should not need to\n        // whitelist 'next'. However, browsers are accidentally\n        // relying on it\n        // https://bugs.chromium.org/p/v8/issues/detail?id=4769#\n        // https://bugs.webkit.org/show_bug.cgi?id=154475\n        // and we will be whitelisting it as we transition to ES6\n        // anyway, so we unconditionally whitelist it now.\n        next: '*',\n        constructor: false,\n      },\n      ArrayIteratorPrototype: {},\n      StringIteratorPrototype: {},\n      MapIteratorPrototype: {},\n      SetIteratorPrototype: {},\n      // AsyncIteratorPrototype does not inherit from IteratorPrototype\n      AsyncIteratorPrototype: {},\n\n      // The %GeneratorFunction% intrinsic is the constructor of\n      // generator functions, so %GeneratorFunction%.prototype is\n      // the %Generator% intrinsic, which all generator functions\n      // inherit from. A generator function is effectively the\n      // constructor of its generator instances, so, for each\n      // generator function (e.g., \"g1\" on the diagram at\n      // http://people.mozilla.org/~jorendorff/figure-2.png )\n      // its .prototype is a prototype that its instances inherit\n      // from. Paralleling this structure, %Generator%.prototype,\n      // i.e., %GeneratorFunction%.prototype.prototype, is the\n      // object that all these generator function prototypes inherit\n      // from. The .next, .return and .throw that generator\n      // instances respond to are actually the builtin methods they\n      // inherit from this object.\n      GeneratorFunction: {\n        // 25.2\n        length: '*', // Not sure why this is needed\n        prototype: {\n          // 25.4\n          prototype: {\n            next: '*',\n            return: '*',\n            throw: '*',\n            constructor: '*', // Not sure why this is needed\n          },\n        },\n      },\n      AsyncGeneratorFunction: {\n        // 25.3\n        length: '*',\n        prototype: {\n          // 25.5\n          prototype: {\n            next: '*',\n            return: '*',\n            throw: '*',\n            constructor: '*', // Not sure why this is needed\n          },\n        },\n      },\n      AsyncFunction: {\n        // 25.7\n        length: '*',\n        prototype: '*',\n      },\n\n      TypedArray: (TypedArrayWhitelist = {\n        // 22.2\n        length: '*', // does not inherit from Function.prototype on Chrome\n        name: '*', // ditto\n        from: t,\n        of: t,\n        BYTES_PER_ELEMENT: '*',\n        prototype: {\n          buffer: 'maybeAccessor',\n          byteLength: 'maybeAccessor',\n          byteOffset: 'maybeAccessor',\n          copyWithin: '*',\n          entries: '*',\n          every: '*',\n          fill: '*',\n          filter: '*',\n          find: '*',\n          findIndex: '*',\n          forEach: '*',\n          includes: '*',\n          indexOf: '*',\n          join: '*',\n          keys: '*',\n          lastIndexOf: '*',\n          length: 'maybeAccessor',\n          map: '*',\n          reduce: '*',\n          reduceRight: '*',\n          reverse: '*',\n          set: '*',\n          slice: '*',\n          some: '*',\n          sort: '*',\n          subarray: '*',\n          values: '*',\n          BYTES_PER_ELEMENT: '*',\n        },\n      }),\n    },\n\n    namedIntrinsics: {\n      // In order according to\n      // http://www.ecma-international.org/ecma-262/ with chapter\n      // numbers where applicable\n\n      // 18 The Global Object\n\n      // 18.1\n      Infinity: j,\n      NaN: j,\n      undefined: j,\n\n      // 18.2\n      // eval: t,                      // Whitelisting under separate control\n      // by TAME_GLOBAL_EVAL in startSES.js\n      isFinite: t,\n      isNaN: t,\n      parseFloat: t,\n      parseInt: t,\n      decodeURI: t,\n      decodeURIComponent: t,\n      encodeURI: t,\n      encodeURIComponent: t,\n\n      // 19 Fundamental Objects\n\n      Object: {\n        // 19.1\n        assign: t, // ES-Harmony\n        create: t,\n        defineProperties: t, // ES-Harmony\n        defineProperty: t,\n        entries: t, // ES-Harmony\n        freeze: j,\n        getOwnPropertyDescriptor: t,\n        getOwnPropertyDescriptors: t, // proposed ES-Harmony\n        getOwnPropertyNames: t,\n        getOwnPropertySymbols: t, // ES-Harmony\n        getPrototypeOf: t,\n        is: j, // ES-Harmony\n        isExtensible: t,\n        isFrozen: t,\n        isSealed: t,\n        keys: t,\n        preventExtensions: j,\n        seal: j,\n        setPrototypeOf: t, // ES-Harmony\n        values: t, // ES-Harmony\n\n        prototype: {\n          // B.2.2\n          // __proto__: t, whitelisted manually in startSES.js\n          __defineGetter__: t,\n          __defineSetter__: t,\n          __lookupGetter__: t,\n          __lookupSetter__: t,\n\n          constructor: '*',\n          hasOwnProperty: t,\n          isPrototypeOf: t,\n          propertyIsEnumerable: t,\n          toLocaleString: '*',\n          toString: '*',\n          valueOf: '*',\n\n          // Generally allowed\n          [Symbol.iterator]: '*',\n          [Symbol.toPrimitive]: '*',\n          [Symbol.toStringTag]: '*',\n          [Symbol.unscopables]: '*',\n        },\n      },\n\n      Function: {\n        // 19.2\n        length: t,\n        prototype: {\n          apply: t,\n          bind: t,\n          call: t,\n          [Symbol.hasInstance]: '*',\n\n          // 19.2.4 instances\n          length: '*',\n          name: '*', // ES-Harmony\n          prototype: '*',\n          arity: '*', // non-std, deprecated in favor of length\n\n          // Generally allowed\n          [Symbol.species]: 'maybeAccessor', // ES-Harmony?\n        },\n      },\n\n      Boolean: {\n        // 19.3\n        prototype: t,\n      },\n\n      Symbol: {\n        // 19.4               all ES-Harmony\n        asyncIterator: t, // proposed? ES-Harmony\n        for: t,\n        hasInstance: t,\n        isConcatSpreadable: t,\n        iterator: t,\n        keyFor: t,\n        match: t,\n        matchAll: t,\n        replace: t,\n        search: t,\n        species: t,\n        split: t,\n        toPrimitive: t,\n        toStringTag: t,\n        unscopables: t,\n        prototype: t,\n      },\n\n      Error: {\n        // 19.5\n        prototype: {\n          name: '*',\n          message: '*',\n        },\n      },\n      // In ES6 the *Error \"subclasses\" of Error inherit from Error,\n      // since constructor inheritance generally mirrors prototype\n      // inheritance. As explained at\n      // https://code.google.com/p/google-caja/issues/detail?id=1963 ,\n      // debug.js hides away the Error constructor itself, and so needs\n      // to rewire these \"subclass\" constructors. Until we have a more\n      // general mechanism, please maintain this list of whitelisted\n      // subclasses in sync with the list in debug.js of subclasses to\n      // be rewired.\n      EvalError: {\n        prototype: t,\n      },\n      RangeError: {\n        prototype: t,\n      },\n      ReferenceError: {\n        prototype: t,\n      },\n      SyntaxError: {\n        prototype: t,\n      },\n      TypeError: {\n        prototype: t,\n      },\n      URIError: {\n        prototype: t,\n      },\n\n      // 20 Numbers and Dates\n\n      Number: {\n        // 20.1\n        EPSILON: t, // ES-Harmony\n        isFinite: j, // ES-Harmony\n        isInteger: t, // ES-Harmony\n        isNaN: j, // ES-Harmony\n        isSafeInteger: j, // ES-Harmony\n        MAX_SAFE_INTEGER: j, // ES-Harmony\n        MAX_VALUE: t,\n        MIN_SAFE_INTEGER: j, // ES-Harmony\n        MIN_VALUE: t,\n        NaN: t,\n        NEGATIVE_INFINITY: t,\n        parseFloat: t, // ES-Harmony\n        parseInt: t, // ES-Harmony\n        POSITIVE_INFINITY: t,\n        prototype: {\n          toExponential: t,\n          toFixed: t,\n          toPrecision: t,\n        },\n      },\n\n      Math: {\n        // 20.2\n        E: j,\n        LN10: j,\n        LN2: j,\n        LOG10E: t,\n        LOG2E: t,\n        PI: j,\n        SQRT1_2: t,\n        SQRT2: t,\n\n        abs: j,\n        acos: t,\n        acosh: t, // ES-Harmony\n        asin: t,\n        asinh: t, // ES-Harmony\n        atan: t,\n        atanh: t, // ES-Harmony\n        atan2: t,\n        cbrt: t, // ES-Harmony\n        ceil: j,\n        clz32: t, // ES-Harmony\n        cos: t,\n        cosh: t, // ES-Harmony\n        exp: t,\n        expm1: t, // ES-Harmony\n        floor: j,\n        fround: t, // ES-Harmony\n        hypot: t, // ES-Harmony\n        imul: t, // ES-Harmony\n        log: j,\n        log1p: t, // ES-Harmony\n        log10: j, // ES-Harmony\n        log2: j, // ES-Harmony\n        max: j,\n        min: j,\n        pow: j,\n        random: t, // questionable\n        round: j,\n        sign: t, // ES-Harmony\n        sin: t,\n        sinh: t, // ES-Harmony\n        sqrt: j,\n        tan: t,\n        tanh: t, // ES-Harmony\n        trunc: j, // ES-Harmony\n      },\n\n      // no-arg Date constructor is questionable\n      Date: {\n        // 20.3\n        now: t, // questionable\n        parse: t,\n        UTC: t,\n        prototype: {\n          // Note: coordinate this list with maintanence of repairES5.js\n          getDate: t,\n          getDay: t,\n          getFullYear: t,\n          getHours: t,\n          getMilliseconds: t,\n          getMinutes: t,\n          getMonth: t,\n          getSeconds: t,\n          getTime: t,\n          getTimezoneOffset: t,\n          getUTCDate: t,\n          getUTCDay: t,\n          getUTCFullYear: t,\n          getUTCHours: t,\n          getUTCMilliseconds: t,\n          getUTCMinutes: t,\n          getUTCMonth: t,\n          getUTCSeconds: t,\n          setDate: t,\n          setFullYear: t,\n          setHours: t,\n          setMilliseconds: t,\n          setMinutes: t,\n          setMonth: t,\n          setSeconds: t,\n          setTime: t,\n          setUTCDate: t,\n          setUTCFullYear: t,\n          setUTCHours: t,\n          setUTCMilliseconds: t,\n          setUTCMinutes: t,\n          setUTCMonth: t,\n          setUTCSeconds: t,\n          toDateString: t,\n          toISOString: t,\n          toJSON: t,\n          toLocaleDateString: t,\n          toLocaleString: t,\n          toLocaleTimeString: t,\n          toTimeString: t,\n          toUTCString: t,\n\n          // B.2.4\n          getYear: t,\n          setYear: t,\n          toGMTString: t,\n        },\n      },\n\n      // 21 Text Processing\n\n      String: {\n        // 21.2\n        fromCharCode: j,\n        fromCodePoint: t, // ES-Harmony\n        raw: j, // ES-Harmony\n        prototype: {\n          charAt: t,\n          charCodeAt: t,\n          codePointAt: t, // ES-Harmony\n          concat: t,\n          endsWith: j, // ES-Harmony\n          includes: t, // ES-Harmony\n          indexOf: j,\n          lastIndexOf: j,\n          localeCompare: t,\n          match: t,\n          normalize: t, // ES-Harmony\n          padEnd: t, // ES-Harmony\n          padStart: t, // ES-Harmony\n          repeat: t, // ES-Harmony\n          replace: t,\n          search: t,\n          slice: j,\n          split: t,\n          startsWith: j, // ES-Harmony\n          substring: t,\n          toLocaleLowerCase: t,\n          toLocaleUpperCase: t,\n          toLowerCase: t,\n          toUpperCase: t,\n          trim: t,\n\n          // B.2.3\n          substr: t,\n          anchor: t,\n          big: t,\n          blink: t,\n          bold: t,\n          fixed: t,\n          fontcolor: t,\n          fontsize: t,\n          italics: t,\n          link: t,\n          small: t,\n          strike: t,\n          sub: t,\n          sup: t,\n\n          trimLeft: t, // non-standard\n          trimRight: t, // non-standard\n\n          // 21.1.4 instances\n          length: '*',\n        },\n      },\n\n      RegExp: {\n        // 21.2\n        prototype: {\n          exec: t,\n          flags: 'maybeAccessor',\n          global: 'maybeAccessor',\n          ignoreCase: 'maybeAccessor',\n          [Symbol.match]: '*', // ES-Harmony\n          multiline: 'maybeAccessor',\n          [Symbol.replace]: '*', // ES-Harmony\n          [Symbol.search]: '*', // ES-Harmony\n          source: 'maybeAccessor',\n          [Symbol.split]: '*', // ES-Harmony\n          sticky: 'maybeAccessor',\n          test: t,\n          unicode: 'maybeAccessor', // ES-Harmony\n          dotAll: 'maybeAccessor', // proposed ES-Harmony\n\n          // B.2.5\n          compile: false, // UNSAFE. Purposely suppressed\n\n          // 21.2.6 instances\n          lastIndex: '*',\n          options: '*', // non-std\n        },\n      },\n\n      // 22 Indexed Collections\n\n      Array: {\n        // 22.1\n        from: j,\n        isArray: t,\n        of: j, // ES-Harmony?\n        prototype: {\n          concat: t,\n          copyWithin: t, // ES-Harmony\n          entries: t, // ES-Harmony\n          every: t,\n          fill: t, // ES-Harmony\n          filter: j,\n          find: t, // ES-Harmony\n          findIndex: t, // ES-Harmony\n          forEach: j,\n          includes: t, // ES-Harmony\n          indexOf: j,\n          join: t,\n          keys: t, // ES-Harmony\n          lastIndexOf: j,\n          map: j,\n          pop: j,\n          push: j,\n          reduce: j,\n          reduceRight: j,\n          reverse: t,\n          shift: j,\n          slice: j,\n          some: t,\n          sort: t,\n          splice: t,\n          unshift: j,\n          values: t, // ES-Harmony\n\n          // 22.1.4 instances\n          length: '*',\n        },\n      },\n\n      // 22.2 Typed Array stuff\n      // TODO: Not yet organized according to spec order\n\n      Int8Array: TypedArrayWhitelist,\n      Uint8Array: TypedArrayWhitelist,\n      Uint8ClampedArray: TypedArrayWhitelist,\n      Int16Array: TypedArrayWhitelist,\n      Uint16Array: TypedArrayWhitelist,\n      Int32Array: TypedArrayWhitelist,\n      Uint32Array: TypedArrayWhitelist,\n      Float32Array: TypedArrayWhitelist,\n      Float64Array: TypedArrayWhitelist,\n\n      // 23 Keyed Collections          all ES-Harmony\n\n      Map: {\n        // 23.1\n        prototype: {\n          clear: j,\n          delete: j,\n          entries: j,\n          forEach: j,\n          get: j,\n          has: j,\n          keys: j,\n          set: j,\n          size: 'maybeAccessor',\n          values: j,\n        },\n      },\n\n      Set: {\n        // 23.2\n        prototype: {\n          add: j,\n          clear: j,\n          delete: j,\n          entries: j,\n          forEach: j,\n          has: j,\n          keys: j,\n          size: 'maybeAccessor',\n          values: j,\n        },\n      },\n\n      WeakMap: {\n        // 23.3\n        prototype: {\n          // Note: coordinate this list with maintenance of repairES5.js\n          delete: j,\n          get: j,\n          has: j,\n          set: j,\n        },\n      },\n\n      WeakSet: {\n        // 23.4\n        prototype: {\n          add: j,\n          delete: j,\n          has: j,\n        },\n      },\n\n      // 24 Structured Data\n\n      ArrayBuffer: {\n        // 24.1            all ES-Harmony\n        isView: t,\n        length: t, // does not inherit from Function.prototype on Chrome\n        name: t, // ditto\n        prototype: {\n          byteLength: 'maybeAccessor',\n          slice: t,\n        },\n      },\n\n      // 24.2 TODO: Omitting SharedArrayBuffer for now\n\n      DataView: {\n        // 24.3               all ES-Harmony\n        length: t, // does not inherit from Function.prototype on Chrome\n        name: t, // ditto\n        BYTES_PER_ELEMENT: '*', // non-standard. really?\n        prototype: {\n          buffer: 'maybeAccessor',\n          byteOffset: 'maybeAccessor',\n          byteLength: 'maybeAccessor',\n          getFloat32: t,\n          getFloat64: t,\n          getInt8: t,\n          getInt16: t,\n          getInt32: t,\n          getUint8: t,\n          getUint16: t,\n          getUint32: t,\n          setFloat32: t,\n          setFloat64: t,\n          setInt8: t,\n          setInt16: t,\n          setInt32: t,\n          setUint8: t,\n          setUint16: t,\n          setUint32: t,\n        },\n      },\n\n      // 24.4 TODO: Omitting Atomics for now\n\n      JSON: {\n        // 24.5\n        parse: j,\n        stringify: j,\n      },\n\n      // 25 Control Abstraction Objects\n\n      Promise: {\n        // 25.4\n        all: j,\n        race: j,\n        reject: j,\n        resolve: j,\n        prototype: {\n          catch: t,\n          then: j,\n          finally: t, // proposed ES-Harmony\n\n          // nanoq.js\n          get: t,\n          put: t,\n          del: t,\n          post: t,\n          invoke: t,\n          fapply: t,\n          fcall: t,\n\n          // Temporary compat with the old makeQ.js\n          send: t,\n          delete: t,\n          end: t,\n        },\n      },\n\n      // nanoq.js\n      Q: {\n        all: t,\n        race: t,\n        reject: t,\n        resolve: t,\n\n        join: t,\n        isPassByCopy: t,\n        passByCopy: t,\n        makeRemote: t,\n        makeFar: t,\n\n        // Temporary compat with the old makeQ.js\n        shorten: t,\n        isPromise: t,\n        async: t,\n        rejected: t,\n        promise: t,\n        delay: t,\n        memoize: t,\n        defer: t,\n      },\n\n      // 26 Reflection\n\n      Reflect: {\n        // 26.1\n        apply: t,\n        construct: t,\n        defineProperty: t,\n        deleteProperty: t,\n        get: t,\n        getOwnPropertyDescriptor: t,\n        getPrototypeOf: t,\n        has: t,\n        isExtensible: t,\n        ownKeys: t,\n        preventExtensions: t,\n        set: t,\n        setPrototypeOf: t,\n      },\n\n      Proxy: {\n        // 26.2\n        revocable: t,\n      },\n\n      // Appendix B\n\n      // B.2.1\n      escape: t,\n      unescape: t,\n\n      // B.2.5 (RegExp.prototype.compile) is marked 'false' up in 21.2\n\n      // Other\n\n      StringMap: {\n        // A specialized approximation of ES-Harmony's Map.\n        prototype: {}, // Technically, the methods should be on the prototype,\n        // but doing so while preserving encapsulation will be\n        // needlessly expensive for current usage.\n      },\n\n      Realm: {\n        makeRootRealm: t,\n        makeCompartment: t,\n        prototype: {\n          global: 'maybeAccessor',\n          evaluate: t,\n        },\n      },\n\n      SES: {\n        confine: t,\n        confineExpr: t,\n      },\n\n      Nat: j,\n      def: j,\n    },\n  };\n\n  function makeConsole(parentConsole) {\n    /* 'parentConsole' is the parent Realm's original 'console' object. We must\n       wrap it, exposing a 'console' with a 'console.log' (and perhaps others)\n       to the local realm, without allowing access to the original 'console',\n       its return values, or its exception objects, any of which could be used\n       to break confinement via the unsafe Function constructor. */\n\n    // callAndWrapError is copied from proposal-realms/shim/src/realmFacade.js\n    // Like Realm.apply except that it catches anything thrown and rethrows it\n    // as an Error from this realm\n\n    const errorConstructors = new Map([\n      ['EvalError', EvalError],\n      ['RangeError', RangeError],\n      ['ReferenceError', ReferenceError],\n      ['SyntaxError', SyntaxError],\n      ['TypeError', TypeError],\n      ['URIError', URIError],\n    ]);\n\n    function callAndWrapError(target, ...args) {\n      try {\n        return target(...args);\n      } catch (err) {\n        if (Object(err) !== err) {\n          // err is a primitive value, which is safe to rethrow\n          throw err;\n        }\n        let eName;\n        let eMessage;\n        let eStack;\n        try {\n          // The child environment might seek to use 'err' to reach the\n          // parent's intrinsics and corrupt them. `${err.name}` will cause\n          // string coercion of 'err.name'. If err.name is an object (probably\n          // a String of the parent Realm), the coercion uses\n          // err.name.toString(), which is under the control of the parent. If\n          // err.name were a primitive (e.g. a number), it would use\n          // Number.toString(err.name), using the child's version of Number\n          // (which the child could modify to capture its argument for later\n          // use), however primitives don't have properties like .prototype so\n          // they aren't useful for an attack.\n          eName = `${err.name}`;\n          eMessage = `${err.message}`;\n          eStack = `${err.stack}`;\n          // eName/eMessage/eStack are now child-realm primitive strings, and\n          // safe to expose\n        } catch (ignored) {\n          // if err.name.toString() throws, keep the (parent realm) Error away\n          // from the child\n          throw new Error('unknown error');\n        }\n        const ErrorConstructor = errorConstructors.get(eName) || Error;\n        try {\n          throw new ErrorConstructor(eMessage);\n        } catch (err2) {\n          err2.stack = eStack; // replace with the captured inner stack\n          throw err2;\n        }\n      }\n    }\n\n    const newConsole = {};\n    const passThrough = [\n      'log',\n      'info',\n      'warn',\n      'error',\n      'group',\n      'groupEnd',\n      'trace',\n      'time',\n      'timeLog',\n      'timeEnd',\n    ];\n    // TODO: those are the properties that MDN documents. Node.js has a bunch\n    // of additional ones that I didn't include, which might be appropriate.\n\n    passThrough.forEach(name => {\n      // TODO: do we reveal the presence/absence of these properties to the\n      // child realm, thus exposing nondeterminism (and a hint of what platform\n      // you might be on) when it is constructed with {consoleMode: allow} ? Or\n      // should we expose the same set all the time, but silently ignore calls\n      // to the missing ones, to hide that variation? We might even consider\n      // adding console.* to the child realm all the time, even without\n      // consoleMode:allow, but ignore the calls unless the mode is enabled.\n      if (name in parentConsole) {\n        const orig = parentConsole[name];\n        // TODO: in a stack trace, this appears as\n        // \"Object.newConsole.(anonymous function) [as trace]\"\n        // can we make that \"newConsole.trace\" ?\n        newConsole[name] = function newerConsole(...args) {\n          callAndWrapError(orig, ...args);\n        };\n      }\n    });\n\n    return newConsole;\n  }\n\n  function makeMakeRequire(r, harden) {\n    function makeRequire(config) {\n      const cache = new Map();\n\n      function build(what) {\n        // This approach denies callers the ability to use inheritance to\n        // manage their config objects, but a simple \"if (what in config)\"\n        // predicate would also be truthy for e.g. \"toString\" and other\n        // properties of Object.prototype, and require('toString') should be\n        // legal if and only if the config object included an own-property\n        // named 'toString'. Incidentally, this could have been\n        // \"config.hasOwnProperty(what)\" but eslint complained.\n        if (!Object.prototype.hasOwnProperty.call(config, what)) {\n          throw new Error(`Cannot find module '${what}'`);\n        }\n        const c = config[what];\n\n        // some modules are hard-coded ways to access functionality that SES\n        // provides directly\n        if (what === '@agoric/harden') {\n          return harden;\n        }\n\n        // If the config points at a simple function, it must be a pure\n        // function with no dependencies (i.e. no 'require' or 'import', no\n        // calls to other functions defined in the same file but outside the\n        // function body). We stringify it and evaluate it inside this realm.\n        if (typeof c === 'function') {\n          return r.evaluate(`(${c})`);\n        }\n\n        // else we treat it as an object with an 'attenuatorSource' property\n        // that defines an attenuator function, which we evaluate. We then\n        // invoke it with the config object, which can contain authorities that\n        // it can wrap. The return value from this invocation is the module\n        // object that gets returned from require(). The attenuator function\n        // and the module it returns are in-realm, the authorities it wraps\n        // will be out-of-realm.\n        const src = `(${c.attenuatorSource})`;\n        const attenuator = r.evaluate(src);\n        return attenuator(c);\n      }\n\n      function newRequire(whatArg) {\n        const what = `${whatArg}`;\n        if (!cache.has(what)) {\n          cache.set(what, harden(build(what)));\n        }\n        return cache.get(what);\n      }\n\n      return newRequire;\n    }\n\n    return makeRequire;\n  }\n\n  // Copyright (C) 2018 Agoric\n\n  function createSESWithRealmConstructor(creatorStrings, Realm) {\n    function makeSESRootRealm(options) {\n      // eslint-disable-next-line no-param-reassign\n      options = Object(options); // Todo: sanitize\n      const shims = [];\n      const wl = JSON.parse(JSON.stringify(options.whitelist || whitelist));\n\n      // \"allow\" enables real Date.now(), anything else gets NaN\n      // (it'd be nice to allow a fixed numeric value, but too hard to\n      // implement right now)\n      if (options.dateNowMode !== 'allow') {\n        shims.push(`(${tameDate})();`);\n      }\n\n      if (options.mathRandomMode !== 'allow') {\n        shims.push(`(${tameMath})();`);\n      }\n\n      // Intl is disabled entirely for now, deleted by removeProperties. If we\n      // want to bring it back (under the control of this option), we'll need\n      // to add it to the whitelist too, as well as taming it properly.\n      if (options.intlMode !== 'allow') {\n        // this shim also disables Object.prototype.toLocaleString\n        shims.push(`(${tameIntl})();`);\n      }\n\n      if (options.errorStackMode !== 'allow') {\n        shims.push(`(${tameError})();`);\n      } else {\n        // if removeProperties cleans these things from Error, v8 won't provide\n        // stack traces or even toString on exceptions, and then Node.js prints\n        // uncaught exceptions as \"undefined\" instead of a type/message/stack.\n        // So if we're allowing stack traces, make sure the whitelist is\n        // augmented to include them.\n        wl.namedIntrinsics.Error.captureStackTrace = true;\n        wl.namedIntrinsics.Error.stackTraceLimit = true;\n        wl.namedIntrinsics.Error.prepareStackTrace = true;\n      }\n\n      if (options.regexpMode !== 'allow') {\n        shims.push(`(${tameRegExp})();`);\n      }\n\n      // The getAnonIntrinsics function might be renamed by e.g. rollup. The\n      // removeProperties() function references it by name, so we need to force\n      // it to have a specific name.\n      const removeProp = `const getAnonIntrinsics = (${getAnonIntrinsics$1});\n               (${removeProperties})(this, ${JSON.stringify(wl)})`;\n      shims.push(removeProp);\n\n      const r = Realm.makeRootRealm({ shims });\n\n      // Build a harden() with an empty fringe. It will be populated later when\n      // we call harden(allIntrinsics).\n      const makeHardenerSrc = `(${makeHardener})`;\n      const harden = r.evaluate(makeHardenerSrc)(\n        undefined,\n        options.hardenerOptions,\n      );\n\n      const b = r.evaluate(creatorStrings);\n      b.createSESInThisRealm(r.global, creatorStrings, r);\n      // b.removeProperties(r.global);\n\n      if (options.consoleMode === 'allow') {\n        const s = `(${makeConsole})`;\n        r.global.console = r.evaluate(s)(console);\n      }\n\n      // Finally freeze all the primordials, and the global object. This must\n      // be the last thing we do that modifies the Realm's globals.\n      const anonIntrinsics = r.evaluate(`(${getAnonIntrinsics$1})`)(r.global);\n      const allIntrinsics = r.evaluate(`(${getAllPrimordials})`)(\n        r.global,\n        anonIntrinsics,\n      );\n      harden(allIntrinsics);\n\n      // build the makeRequire helper, glue it to the new Realm\n      r.makeRequire = harden(r.evaluate(`(${makeMakeRequire})`)(r, harden));\n\n      return r;\n    }\n    const SES = {\n      makeSESRootRealm,\n    };\n\n    return SES;\n  }\n\n  function createSESInThisRealm(global, creatorStrings, parentRealm) {\n    // eslint-disable-next-line no-param-reassign,no-undef\n    global.SES = createSESWithRealmConstructor(creatorStrings, Realm);\n    // todo: wrap exceptions, effectively undoing the wrapping that\n    // Realm.evaluate does\n\n    const errorConstructors = new Map([\n      ['EvalError', EvalError],\n      ['RangeError', RangeError],\n      ['ReferenceError', ReferenceError],\n      ['SyntaxError', SyntaxError],\n      ['TypeError', TypeError],\n      ['URIError', URIError],\n    ]);\n\n    // callAndWrapError is copied from the Realm shim. Our SES.confine (from\n    // inside the realm) delegates to Realm.evaluate (from outside the realm),\n    // but we need the exceptions to come from our own realm, so we use this to\n    // reverse the shim's own callAndWrapError. TODO: look for a reasonable way\n    // to avoid the double-wrapping, maybe by changing the shim/Realms-spec to\n    // provide the safeEvaluator as a Realm.evaluate method (inside a realm).\n    // That would make this trivial: global.SES = Realm.evaluate (modulo\n    // potential 'this' issues)\n\n    // the comments here were written from the POV of a parent defending itself\n    // against a malicious child realm. In this case, we are the child.\n\n    function callAndWrapError(target, ...args) {\n      try {\n        return target(...args);\n      } catch (err) {\n        if (Object(err) !== err) {\n          // err is a primitive value, which is safe to rethrow\n          throw err;\n        }\n        let eName;\n        let eMessage;\n        let eStack;\n        try {\n          // The child environment might seek to use 'err' to reach the\n          // parent's intrinsics and corrupt them. `${err.name}` will cause\n          // string coercion of 'err.name'. If err.name is an object (probably\n          // a String of the parent Realm), the coercion uses\n          // err.name.toString(), which is under the control of the parent. If\n          // err.name were a primitive (e.g. a number), it would use\n          // Number.toString(err.name), using the child's version of Number\n          // (which the child could modify to capture its argument for later\n          // use), however primitives don't have properties like .prototype so\n          // they aren't useful for an attack.\n          eName = `${err.name}`;\n          eMessage = `${err.message}`;\n          eStack = `${err.stack}`;\n          // eName/eMessage/eStack are now child-realm primitive strings, and\n          // safe to expose\n        } catch (ignored) {\n          // if err.name.toString() throws, keep the (parent realm) Error away\n          // from the child\n          throw new Error('unknown error');\n        }\n        const ErrorConstructor = errorConstructors.get(eName) || Error;\n        try {\n          throw new ErrorConstructor(eMessage);\n        } catch (err2) {\n          err2.stack = eStack; // replace with the captured inner stack\n          throw err2;\n        }\n      }\n    }\n\n    // We must not allow other child code to access that object. SES.confine\n    // closes over the parent's Realm object so it shouldn't be accessible from\n    // the outside.\n\n    // eslint-disable-next-line no-param-reassign\n    global.SES.confine = (code, endowments) =>\n      callAndWrapError(() => parentRealm.evaluate(code, endowments));\n    // eslint-disable-next-line no-param-reassign\n    global.SES.confineExpr = (code, endowments) =>\n      callAndWrapError(() => parentRealm.evaluate(`(${code})`, endowments));\n  }\n\n  // Copyright (C) 2018 Agoric\n\n  exports.createSESInThisRealm = createSESInThisRealm;\n  exports.createSESWithRealmConstructor = createSESWithRealmConstructor;\n\n  return exports;\n\n}({}))"; // Copyright (C) 2018 Agoric

const SES = createSESWithRealmConstructor(creatorStrings, Realm);
var _default = SES;
exports.default = _default;
},{"@agoric/make-hardener":"Pi9h","vm":"boWn"}],"4nUr":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildWhitelist = buildWhitelist;

// Copyright (C) 2011 Google Inc.
// Copyright (C) 2018 Agoric
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Based on https://github.com/Agoric/SES/blob/master/src/bundle/whitelist.js
 *
 * @author Mark S. Miller,
 */
function buildWhitelist() {
  "use strict";

  var j = true; // included in the Jessie runtime

  var namedIntrinsics = {
    cajaVM: {
      // Caja support
      Nat: j,
      def: j,
      confine: j
    },
    // In order according to
    // http://www.ecma-international.org/ecma-262/ with chapter
    // numbers where applicable
    // 18 The Global Object
    Infinity: j,
    NaN: j,
    undefined: j,
    // 19 Fundamental Objects
    Object: {
      // 19.1
      freeze: j,
      is: j,
      // ES-Harmony
      preventExtensions: j,
      seal: j,
      entries: j,
      keys: j,
      values: j
    },
    Boolean: {// 19.3
    },
    // 20 Numbers and Dates
    Number: {
      // 20.1
      isFinite: j,
      // ES-Harmony
      isNaN: j,
      // ES-Harmony
      isSafeInteger: j,
      // ES-Harmony
      MAX_SAFE_INTEGER: j,
      // ES-Harmony
      MIN_SAFE_INTEGER: j // ES-Harmony

    },
    Math: {
      // 20.2
      E: j,
      PI: j,
      abs: j,
      ceil: j,
      floor: j,
      max: j,
      min: j,
      round: j,
      trunc: j // ES-Harmony

    },
    // 21 Text Processing
    String: {
      // 21.2
      fromCharCode: j,
      raw: j,
      // ES-Harmony
      prototype: {
        charCodeAt: j,
        endsWith: j,
        // ES-Harmony
        indexOf: j,
        lastIndexOf: j,
        slice: j,
        split: j,
        startsWith: j // ES-Harmony

      }
    },
    // 22 Indexed Collections
    Array: {
      // 22.1
      from: j,
      isArray: j,
      of: j,
      // ES-Harmony?
      prototype: {
        filter: j,
        forEach: j,
        indexOf: j,
        join: j,
        lastIndexOf: j,
        map: j,
        pop: j,
        push: j,
        reduce: j,
        reduceRight: j,
        slice: j
      }
    },
    // 23 Keyed Collections          all ES-Harmony
    Map: {
      // 23.1
      prototype: {
        clear: j,
        delete: j,
        entries: j,
        forEach: j,
        get: j,
        has: j,
        keys: j,
        set: j,
        values: j
      }
    },
    Set: {
      // 23.2
      prototype: {
        add: j,
        clear: j,
        delete: j,
        entries: j,
        forEach: j,
        has: j,
        keys: j,
        values: j
      }
    },
    WeakMap: {
      // 23.3
      prototype: {
        // Note: coordinate this list with maintenance of repairES5.js
        delete: j,
        get: j,
        has: j,
        set: j
      }
    },
    WeakSet: {
      // 23.4
      prototype: {
        add: j,
        delete: j,
        has: j
      }
    },
    // 24.4 TODO: Omitting Atomics for now
    JSON: {
      // 24.5
      parse: j,
      stringify: j
    },
    Promise: {
      // 25.4
      all: j,
      race: j,
      reject: j,
      resolve: j,
      prototype: {
        catch: j,
        then: j
      }
    }
  };
  return {
    namedIntrinsics: namedIntrinsics,
    anonIntrinsics: {}
  };
}
},{}],"t+IF":[function(require,module,exports) {
var define;
var global = arguments[3];
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.harden = factory());
}(this, function () { 'use strict';

  // Adapted from SES/Caja - Copyright (C) 2011 Google Inc.
  // Copyright (C) 2018 Agoric

  // Licensed under the Apache License, Version 2.0 (the "License");
  // you may not use this file except in compliance with the License.
  // You may obtain a copy of the License at
  //
  // http://www.apache.org/licenses/LICENSE-2.0
  //
  // Unless required by applicable law or agreed to in writing, software
  // distributed under the License is distributed on an "AS IS" BASIS,
  // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  // See the License for the specific language governing permissions and
  // limitations under the License.

  // based upon:
  // https://github.com/google/caja/blob/master/src/com/google/caja/ses/startSES.js
  // https://github.com/google/caja/blob/master/src/com/google/caja/ses/repairES5.js
  // then copied from proposal-frozen-realms deep-freeze.js
  // then copied from SES/src/bundle/deepFreeze.js

  function makeHardener(initialFringe) {
    const { freeze, getOwnPropertyDescriptors, getPrototypeOf } = Object;
    const { ownKeys } = Reflect;
    // Objects that we won't freeze, either because we've frozen them already,
    // or they were one of the initial roots (terminals). These objects form
    // the "fringe" of the hardened object graph.
    const fringeSet = new WeakSet(initialFringe);

    function harden(root) {
      const toFreeze = new Set();
      const prototypes = new Map();
      const paths = new WeakMap();

      // If val is something we should be freezing but aren't yet,
      // add it to toFreeze.
      function enqueue(val, path) {
        if (Object(val) !== val) {
          // ignore primitives
          return;
        }
        const type = typeof val;
        if (type !== 'object' && type !== 'function') {
          // future proof: break until someone figures out what it should do
          throw new TypeError(`Unexpected typeof: ${type}`);
        }
        if (fringeSet.has(val) || toFreeze.has(val)) {
          // Ignore if this is an exit, or we've already visited it
          return;
        }
        // console.log(`adding ${val} to toFreeze`, val);
        toFreeze.add(val);
        paths.set(val, path);
      }

      function freezeAndTraverse(obj) {
        // Immediately freeze the object to ensure reactive
        // objects such as proxies won't add properties
        // during traversal, before they get frozen.

        // Object are verified before being enqueued,
        // therefore this is a valid candidate.
        // Throws if this fails (strict mode).
        freeze(obj);

        // we rely upon certain commitments of Object.freeze and proxies here

        // get stable/immutable outbound links before a Proxy has a chance to do
        // something sneaky.
        const proto = getPrototypeOf(obj);
        const descs = getOwnPropertyDescriptors(obj);
        const path = paths.get(obj) || 'unknown';

        // console.log(`adding ${proto} to prototypes under ${path}`);
        if (proto !== null && !prototypes.has(proto)) {
          prototypes.set(proto, path);
          paths.set(proto, `${path}.__proto__`);
        }

        ownKeys(descs).forEach(name => {
          const pathname = `${path}.${String(name)}`;
          // todo uncurried form
          // todo: getOwnPropertyDescriptors is guaranteed to return well-formed
          // descriptors, but they still inherit from Object.prototype. If
          // someone has poisoned Object.prototype to add 'value' or 'get'
          // properties, then a simple 'if ("value" in desc)' or 'desc.value'
          // test could be confused. We use hasOwnProperty to be sure about
          // whether 'value' is present or not, which tells us for sure that this
          // is a data property.
          const desc = descs[name];
          if ('value' in desc) {
            // todo uncurried form
            enqueue(desc.value, `${pathname}`);
          } else {
            enqueue(desc.get, `${pathname}(get)`);
            enqueue(desc.set, `${pathname}(set)`);
          }
        });
      }

      function dequeue() {
        // New values added before forEach() has finished will be visited.
        toFreeze.forEach(freezeAndTraverse); // todo curried forEach
      }

      function checkPrototypes() {
        prototypes.forEach((path, p) => {
          if (!(toFreeze.has(p) || fringeSet.has(p))) {
            // all reachable properties have already been frozen by this point
            throw new TypeError(
              `prototype ${p} of ${path} is not already in the fringeSet`,
            );
          }
        });
      }

      function commit() {
        // todo curried forEach
        // we capture the real WeakSet.prototype.add above, in case someone
        // changes it. The two-argument form of forEach passes the second
        // argument as the 'this' binding, so we add to the correct set.
        toFreeze.forEach(fringeSet.add, fringeSet);
      }

      enqueue(root);
      dequeue();
      // console.log("fringeSet", fringeSet);
      // console.log("prototype set:", prototypes);
      // console.log("toFreeze set:", toFreeze);
      checkPrototypes();
      commit();

      return root;
    }

    return harden;
  }

  // Copyright (C) 2011 Google Inc.
  // Copyright (C) 2018 Agoric
  //
  // Licensed under the Apache License, Version 2.0 (the "License");
  // you may not use this file except in compliance with the License.
  // You may obtain a copy of the License at
  //
  // https://www.apache.org/licenses/LICENSE-2.0
  //
  // Unless required by applicable law or agreed to in writing, software
  // distributed under the License is distributed on an "AS IS" BASIS,
  // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  // See the License for the specific language governing permissions and
  // limitations under the License.

  // TODO(erights): We should test for
  // We now have a reason to omit Proxy from the whitelist.
  // The makeBrandTester in repairES5 uses Allen's trick at
  // https://esdiscuss.org/topic/tostringtag-spoofing-for-null-and-undefined#content-59
  // , but testing reveals that, on FF 35.0.1, a proxy on an exotic
  // object X will pass this brand test when X will. This is fixed as of
  // FF Nightly 38.0a1.

  /**
   * <p>Qualifying platforms generally include all JavaScript platforms
   * shown on <a href="http://kangax.github.com/es5-compat-table/"
   * >ECMAScript 5 compatibility table</a> that implement {@code
   * Object.getOwnPropertyNames}. At the time of this writing,
   * qualifying browsers already include the latest released versions of
   * Internet Explorer (9), Firefox (4), Chrome (11), and Safari
   * (5.0.5), their corresponding standalone (e.g., server-side) JavaScript
   * engines, Rhino 1.73, and BESEN.
   *
   * <p>On such not-quite-ES5 platforms, some elements of these
   * emulations may lose SES safety, as enumerated in the comment on
   * each problem record in the {@code baseProblems} and {@code
   * supportedProblems} array below. The platform must at least provide
   * {@code Object.getOwnPropertyNames}, because it cannot reasonably be
   * emulated.
   *
   * <p>This file is useful by itself, as it has no dependencies on the
   * rest of SES. It creates no new global bindings, but merely repairs
   * standard globals or standard elements reachable from standard
   * globals. If the future-standard {@code WeakMap} global is present,
   * as it is currently on FF7.0a1, then it will repair it in place. The
   * one non-standard element that this file uses is {@code console} if
   * present, in order to report the repairs it found necessary, in
   * which case we use its {@code log, info, warn}, and {@code error}
   * methods. If {@code console.log} is absent, then this file performs
   * its repairs silently.
   *
   * <p>Generally, this file should be run as the first script in a
   * JavaScript context (i.e. a browser frame), as it relies on other
   * primordial objects and methods not yet being perturbed.
   *
   * <p>TODO(erights): This file tries to protect itself from some
   * post-initialization perturbation by stashing some of the
   * primordials it needs for later use, but this attempt is currently
   * incomplete. We need to revisit this when we support Confined-ES5,
   * as a variant of SES in which the primordials are not frozen. See
   * previous failed attempt at <a
   * href="https://codereview.appspot.com/5278046/" >Speeds up
   * WeakMap. Preparing to support unfrozen primordials.</a>. From
   * analysis of this failed attempt, it seems that the only practical
   * way to support CES is by use of two frames, where most of initSES
   * runs in a SES frame, and so can avoid worrying about most of these
   * perturbations.
   */
  function getAnonIntrinsics(global) {

    const gopd = Object.getOwnPropertyDescriptor;
    const getProto = Object.getPrototypeOf;

    // ////////////// Undeniables and Intrinsics //////////////

    /**
     * The undeniables are the primordial objects which are ambiently
     * reachable via compositions of strict syntax, primitive wrapping
     * (new Object(x)), and prototype navigation (the equivalent of
     * Object.getPrototypeOf(x) or x.__proto__). Although we could in
     * theory monkey patch primitive wrapping or prototype navigation,
     * we won't. Hence, without parsing, the following are undeniable no
     * matter what <i>other</i> monkey patching we do to the primordial
     * environment.
     */

    // The first element of each undeniableTuple is a string used to
    // name the undeniable object for reporting purposes. It has no
    // other programmatic use.
    //
    // The second element of each undeniableTuple should be the
    // undeniable itself.
    //
    // The optional third element of the undeniableTuple, if present,
    // should be an example of syntax, rather than use of a monkey
    // patchable API, evaluating to a value from which the undeniable
    // object in the second element can be reached by only the
    // following steps:
    // If the value is primitve, convert to an Object wrapper.
    // Is the resulting object either the undeniable object, or does
    // it inherit directly from the undeniable object?

    function* aStrictGenerator() {} // eslint-disable-line no-empty-function
    const Generator = getProto(aStrictGenerator);
    async function* aStrictAsyncGenerator() {} // eslint-disable-line no-empty-function
    const AsyncGenerator = getProto(aStrictAsyncGenerator);
    async function aStrictAsyncFunction() {} // eslint-disable-line no-empty-function
    const AsyncFunctionPrototype = getProto(aStrictAsyncFunction);

    // TODO: this is dead code, but could be useful: make this the
    // 'undeniables' object available via some API.

    const undeniableTuples = [
      ['Object.prototype', Object.prototype, {}],
      ['Function.prototype', Function.prototype, function foo() {}],
      ['Array.prototype', Array.prototype, []],
      ['RegExp.prototype', RegExp.prototype, /x/],
      ['Boolean.prototype', Boolean.prototype, true],
      ['Number.prototype', Number.prototype, 1],
      ['String.prototype', String.prototype, 'x'],
      ['%Generator%', Generator, aStrictGenerator],
      ['%AsyncGenerator%', AsyncGenerator, aStrictAsyncGenerator],
      ['%AsyncFunction%', AsyncFunctionPrototype, aStrictAsyncFunction],
    ];

    undeniableTuples.forEach(tuple => {
      const name = tuple[0];
      const undeniable = tuple[1];
      let start = tuple[2];
      if (start === undefined) {
        return;
      }
      start = Object(start);
      if (undeniable === start) {
        return;
      }
      if (undeniable === getProto(start)) {
        return;
      }
      throw new Error(`Unexpected undeniable: ${undeniable}`);
    });

    function registerIteratorProtos(registery, base, name) {
      const iteratorSym =
        (global.Symbol && global.Symbol.iterator) || '@@iterator'; // used instead of a symbol on FF35

      if (base[iteratorSym]) {
        const anIter = base[iteratorSym]();
        const anIteratorPrototype = getProto(anIter);
        registery[name] = anIteratorPrototype; // eslint-disable-line no-param-reassign
        const anIterProtoBase = getProto(anIteratorPrototype);
        if (anIterProtoBase !== Object.prototype) {
          if (!registery.IteratorPrototype) {
            if (getProto(anIterProtoBase) !== Object.prototype) {
              throw new Error(
                '%IteratorPrototype%.__proto__ was not Object.prototype',
              );
            }
            registery.IteratorPrototype = anIterProtoBase; // eslint-disable-line no-param-reassign
          } else if (registery.IteratorPrototype !== anIterProtoBase) {
            throw new Error(`unexpected %${name}%.__proto__`);
          }
        }
      }
    }

    /**
     * Get the intrinsics not otherwise reachable by named own property
     * traversal. See
     * https://people.mozilla.org/~jorendorff/es6-draft.html#sec-well-known-intrinsic-objects
     * and the instrinsics section of whitelist.js
     *
     * <p>Unlike getUndeniables(), the result of sampleAnonIntrinsics()
     * does depend on the current state of the primordials, so we must
     * run this again after all other relevant monkey patching is done,
     * in order to properly initialize cajaVM.intrinsics
     */

    // TODO: we can probably unwrap this into the outer function, and stop
    // using a separately named 'sampleAnonIntrinsics'
    function sampleAnonIntrinsics() {
      const result = {};

      // If there are still other ThrowTypeError objects left after
      // noFuncPoison-ing, this should be caught by
      // test_THROWTYPEERROR_NOT_UNIQUE below, so we assume here that
      // this is the only surviving ThrowTypeError intrinsic.
      // eslint-disable-next-line prefer-rest-params
      result.ThrowTypeError = gopd(arguments, 'callee').get;

      // Get the ES6 %ArrayIteratorPrototype%,
      // %StringIteratorPrototype%, %MapIteratorPrototype%,
      // %SetIteratorPrototype% and %IteratorPrototype% intrinsics, if
      // present.
      registerIteratorProtos(result, [], 'ArrayIteratorPrototype');
      registerIteratorProtos(result, '', 'StringIteratorPrototype');
      if (typeof Map === 'function') {
        registerIteratorProtos(result, new Map(), 'MapIteratorPrototype');
      }
      if (typeof Set === 'function') {
        registerIteratorProtos(result, new Set(), 'SetIteratorPrototype');
      }

      // Get the ES6 %GeneratorFunction% intrinsic, if present.
      if (getProto(Generator) !== Function.prototype) {
        throw new Error('Generator.__proto__ was not Function.prototype');
      }
      const GeneratorFunction = Generator.constructor;
      if (getProto(GeneratorFunction) !== Function.prototype.constructor) {
        throw new Error(
          'GeneratorFunction.__proto__ was not Function.prototype.constructor',
        );
      }
      result.GeneratorFunction = GeneratorFunction;
      const genProtoBase = getProto(Generator.prototype);
      if (genProtoBase !== result.IteratorPrototype) {
        throw new Error('Unexpected Generator.prototype.__proto__');
      }

      // Get the ES6 %AsyncGeneratorFunction% intrinsic, if present.
      if (getProto(AsyncGenerator) !== Function.prototype) {
        throw new Error('AsyncGenerator.__proto__ was not Function.prototype');
      }
      const AsyncGeneratorFunction = AsyncGenerator.constructor;
      if (getProto(AsyncGeneratorFunction) !== Function.prototype.constructor) {
        throw new Error(
          'GeneratorFunction.__proto__ was not Function.prototype.constructor',
        );
      }
      result.AsyncGeneratorFunction = AsyncGeneratorFunction;
      // it appears that the only way to get an AsyncIteratorPrototype is
      // through this getProto() process, so there's nothing to check it
      // against
      /*
        const agenProtoBase = getProto(AsyncGenerator.prototype);
        if (agenProtoBase !== result.AsyncIteratorPrototype) {
          throw new Error('Unexpected AsyncGenerator.prototype.__proto__');
        } */

      // Get the ES6 %AsyncFunction% intrinsic, if present.
      if (getProto(AsyncFunctionPrototype) !== Function.prototype) {
        throw new Error(
          'AsyncFunctionPrototype.__proto__ was not Function.prototype',
        );
      }
      const AsyncFunction = AsyncFunctionPrototype.constructor;
      if (getProto(AsyncFunction) !== Function.prototype.constructor) {
        throw new Error(
          'AsyncFunction.__proto__ was not Function.prototype.constructor',
        );
      }
      result.AsyncFunction = AsyncFunction;

      // Get the ES6 %TypedArray% intrinsic, if present.
      (function getTypedArray() {
        if (!global.Float32Array) {
          return;
        }
        const TypedArray = getProto(global.Float32Array);
        if (TypedArray === Function.prototype) {
          return;
        }
        if (getProto(TypedArray) !== Function.prototype) {
          // http://bespin.cz/~ondras/html/classv8_1_1ArrayBufferView.html
          // has me worried that someone might make such an intermediate
          // object visible.
          throw new Error('TypedArray.__proto__ was not Function.prototype');
        }
        result.TypedArray = TypedArray;
      })();

      Object.keys(result).forEach(name => {
        if (result[name] === undefined) {
          throw new Error(`Malformed intrinsic: ${name}`);
        }
      });

      return result;
    }

    return sampleAnonIntrinsics();
  }

  // Copyright (C) 2011 Google Inc.
  // Copyright (C) 2018 Agoric
  //
  // Licensed under the Apache License, Version 2.0 (the "License");
  // you may not use this file except in compliance with the License.
  // You may obtain a copy of the License at
  //
  // http://www.apache.org/licenses/LICENSE-2.0
  //
  // Unless required by applicable law or agreed to in writing, software
  // distributed under the License is distributed on an "AS IS" BASIS,
  // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  // See the License for the specific language governing permissions and
  // limitations under the License.

  /**
   * @fileoverview Exports {@code ses.whitelist}, a recursively defined
   * JSON record enumerating all the naming paths in the ES5.1 spec,
   * those de-facto extensions that we judge to be safe, and SES and
   * Dr. SES extensions provided by the SES runtime.
   *
   * <p>Assumes only ES3. Compatible with ES5, ES5-strict, or
   * anticipated ES6.
   *
   * //provides ses.whitelist
   * @author Mark S. Miller,
   * @overrides ses, whitelistModule
   */

  /**
   * <p>Each JSON record enumerates the disposition of the properties on
   * some corresponding primordial object, with the root record
   * representing the global object. For each such record, the values
   * associated with its property names can be
   * <ul>
   * <li>Another record, in which case this property is simply
   *     whitelisted and that next record represents the disposition of
   *     the object which is its value. For example, {@code "Object"}
   *     leads to another record explaining what properties {@code
   *     "Object"} may have and how each such property, if present,
   *     and its value should be tamed.
   * <li>true, in which case this property is simply whitelisted. The
   *     value associated with that property is still traversed and
   *     tamed, but only according to the taming of the objects that
   *     object inherits from. For example, {@code "Object.freeze"} leads
   *     to true, meaning that the {@code "freeze"} property of {@code
   *     Object} should be whitelisted and the value of the property (a
   *     function) should be further tamed only according to the
   *     markings of the other objects it inherits from, like {@code
   *     "Function.prototype"} and {@code "Object.prototype").
   *     If the property is an accessor property, it is not
   *     whitelisted (as invoking an accessor might not be meaningful,
   *     yet the accessor might return a value needing taming).
   * <li>"maybeAccessor", in which case this accessor property is simply
   *     whitelisted and its getter and/or setter are tamed according to
   *     inheritance. If the property is not an accessor property, its
   *     value is tamed according to inheritance.
   * <li>"*", in which case this property on this object is whitelisted,
   *     as is this property as inherited by all objects that inherit
   *     from this object. The values associated with all such properties
   *     are still traversed and tamed, but only according to the taming
   *     of the objects that object inherits from. For example, {@code
   *     "Object.prototype.constructor"} leads to "*", meaning that we
   *     whitelist the {@code "constructor"} property on {@code
   *     Object.prototype} and on every object that inherits from {@code
   *     Object.prototype} that does not have a conflicting mark. Each
   *     of these is tamed as if with true, so that the value of the
   *     property is further tamed according to what other objects it
   *     inherits from.
   * <li>false, which suppresses permission inherited via "*".
   * </ul>
   *
   * <p>TODO: We want to do for constructor: something weaker than '*',
   * but rather more like what we do for [[Prototype]] links, which is
   * that it is whitelisted only if it points at an object which is
   * otherwise reachable by a whitelisted path.
   *
   * <p>The members of the whitelist are either
   * <ul>
   * <li>(uncommented) defined by the ES5.1 normative standard text,
   * <li>(questionable) provides a source of non-determinism, in
   *     violation of pure object-capability rules, but allowed anyway
   *     since we've given up on restricting JavaScript to a
   *     deterministic subset.
   * <li>(ES5 Appendix B) common elements of de facto JavaScript
   *     described by the non-normative Appendix B.
   * <li>(Harmless whatwg) extensions documented at
   *     <a href="http://wiki.whatwg.org/wiki/Web_ECMAScript"
   *     >http://wiki.whatwg.org/wiki/Web_ECMAScript</a> that seem to be
   *     harmless. Note that the RegExp constructor extensions on that
   *     page are <b>not harmless</b> and so must not be whitelisted.
   * <li>(ES-Harmony proposal) accepted as "proposal" status for
   *     EcmaScript-Harmony.
   * </ul>
   *
   * <p>With the above encoding, there are some sensible whitelists we
   * cannot express, such as marking a property both with "*" and a JSON
   * record. This is an expedient decision based only on not having
   * encountered such a need. Should we need this extra expressiveness,
   * we'll need to refactor to enable a different encoding.
   *
   * <p>We factor out {@code true} into the variable {@code t} just to
   * get a bit better compression from simple minifiers.
   */

  const t = true;
  const j = true; // included in the Jessie runtime

  let TypedArrayWhitelist; // defined and used below

  const whitelist = {
    // The accessible intrinsics which are not reachable by own
    // property name traversal are listed here so that they are
    // processed by the whitelist, although this also makes them
    // accessible by this path.  See
    // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-well-known-intrinsic-objects
    // Of these, ThrowTypeError is the only one from ES5. All the
    // rest were introduced in ES6.
    anonIntrinsics: {
      ThrowTypeError: {},
      IteratorPrototype: {
        // 25.1
        // Technically, for SES-on-ES5, we should not need to
        // whitelist 'next'. However, browsers are accidentally
        // relying on it
        // https://bugs.chromium.org/p/v8/issues/detail?id=4769#
        // https://bugs.webkit.org/show_bug.cgi?id=154475
        // and we will be whitelisting it as we transition to ES6
        // anyway, so we unconditionally whitelist it now.
        next: '*',
        constructor: false,
      },
      ArrayIteratorPrototype: {},
      StringIteratorPrototype: {},
      MapIteratorPrototype: {},
      SetIteratorPrototype: {},

      // The %GeneratorFunction% intrinsic is the constructor of
      // generator functions, so %GeneratorFunction%.prototype is
      // the %Generator% intrinsic, which all generator functions
      // inherit from. A generator function is effectively the
      // constructor of its generator instances, so, for each
      // generator function (e.g., "g1" on the diagram at
      // http://people.mozilla.org/~jorendorff/figure-2.png )
      // its .prototype is a prototype that its instances inherit
      // from. Paralleling this structure, %Generator%.prototype,
      // i.e., %GeneratorFunction%.prototype.prototype, is the
      // object that all these generator function prototypes inherit
      // from. The .next, .return and .throw that generator
      // instances respond to are actually the builtin methods they
      // inherit from this object.
      GeneratorFunction: {
        // 25.2
        length: '*', // Not sure why this is needed
        prototype: {
          // 25.4
          prototype: {
            next: '*',
            return: '*',
            throw: '*',
            constructor: '*', // Not sure why this is needed
          },
        },
      },
      AsyncGeneratorFunction: {
        // 25.3
        length: '*',
        prototype: {
          // 25.5
          prototype: {
            next: '*',
            return: '*',
            throw: '*',
            constructor: '*', // Not sure why this is needed
          },
        },
      },
      AsyncFunction: {
        // 25.7
        length: '*',
        prototype: '*',
      },

      TypedArray: (TypedArrayWhitelist = {
        // 22.2
        length: '*', // does not inherit from Function.prototype on Chrome
        name: '*', // ditto
        from: t,
        of: t,
        BYTES_PER_ELEMENT: '*',
        prototype: {
          buffer: 'maybeAccessor',
          byteLength: 'maybeAccessor',
          byteOffset: 'maybeAccessor',
          copyWithin: '*',
          entries: '*',
          every: '*',
          fill: '*',
          filter: '*',
          find: '*',
          findIndex: '*',
          forEach: '*',
          includes: '*',
          indexOf: '*',
          join: '*',
          keys: '*',
          lastIndexOf: '*',
          length: 'maybeAccessor',
          map: '*',
          reduce: '*',
          reduceRight: '*',
          reverse: '*',
          set: '*',
          slice: '*',
          some: '*',
          sort: '*',
          subarray: '*',
          values: '*',
          BYTES_PER_ELEMENT: '*',
        },
      }),
    },

    namedIntrinsics: {
      // In order according to
      // http://www.ecma-international.org/ecma-262/ with chapter
      // numbers where applicable

      // 18 The Global Object

      // 18.1
      Infinity: j,
      NaN: j,
      undefined: j,

      // 18.2
      // eval: t,                      // Whitelisting under separate control
      // by TAME_GLOBAL_EVAL in startSES.js
      isFinite: t,
      isNaN: t,
      parseFloat: t,
      parseInt: t,
      decodeURI: t,
      decodeURIComponent: t,
      encodeURI: t,
      encodeURIComponent: t,

      // 19 Fundamental Objects

      Object: {
        // 19.1
        assign: t, // ES-Harmony
        create: t,
        defineProperties: t, // ES-Harmony
        defineProperty: t,
        entries: t, // ES-Harmony
        freeze: j,
        getOwnPropertyDescriptor: t,
        getOwnPropertyDescriptors: t, // proposed ES-Harmony
        getOwnPropertyNames: t,
        getOwnPropertySymbols: t, // ES-Harmony
        getPrototypeOf: t,
        is: j, // ES-Harmony
        isExtensible: t,
        isFrozen: t,
        isSealed: t,
        keys: t,
        preventExtensions: j,
        seal: j,
        setPrototypeOf: t, // ES-Harmony
        values: t, // ES-Harmony

        prototype: {
          // B.2.2
          // __proto__: t, whitelisted manually in startSES.js
          __defineGetter__: t,
          __defineSetter__: t,
          __lookupGetter__: t,
          __lookupSetter__: t,

          constructor: '*',
          hasOwnProperty: t,
          isPrototypeOf: t,
          propertyIsEnumerable: t,
          toLocaleString: '*',
          toString: '*',
          valueOf: '*',

          // Generally allowed
          [Symbol.iterator]: '*',
          [Symbol.toPrimitive]: '*',
          [Symbol.toStringTag]: '*',
          [Symbol.unscopables]: '*',
        },
      },

      Function: {
        // 19.2
        length: t,
        prototype: {
          apply: t,
          bind: t,
          call: t,
          [Symbol.hasInstance]: '*',

          // 19.2.4 instances
          length: '*',
          name: '*', // ES-Harmony
          prototype: '*',
          arity: '*', // non-std, deprecated in favor of length

          // Generally allowed
          [Symbol.species]: 'maybeAccessor', // ES-Harmony?
        },
      },

      Boolean: {
        // 19.3
        prototype: t,
      },

      Symbol: {
        // 19.4               all ES-Harmony
        asyncIterator: t, // proposed? ES-Harmony
        for: t,
        hasInstance: t,
        isConcatSpreadable: t,
        iterator: t,
        keyFor: t,
        match: t,
        replace: t,
        search: t,
        species: t,
        split: t,
        toPrimitive: t,
        toStringTag: t,
        unscopables: t,
        prototype: t,
      },

      Error: {
        // 19.5
        prototype: {
          name: '*',
          message: '*',
        },
      },
      // In ES6 the *Error "subclasses" of Error inherit from Error,
      // since constructor inheritance generally mirrors prototype
      // inheritance. As explained at
      // https://code.google.com/p/google-caja/issues/detail?id=1963 ,
      // debug.js hides away the Error constructor itself, and so needs
      // to rewire these "subclass" constructors. Until we have a more
      // general mechanism, please maintain this list of whitelisted
      // subclasses in sync with the list in debug.js of subclasses to
      // be rewired.
      EvalError: {
        prototype: t,
      },
      RangeError: {
        prototype: t,
      },
      ReferenceError: {
        prototype: t,
      },
      SyntaxError: {
        prototype: t,
      },
      TypeError: {
        prototype: t,
      },
      URIError: {
        prototype: t,
      },

      // 20 Numbers and Dates

      Number: {
        // 20.1
        EPSILON: t, // ES-Harmony
        isFinite: j, // ES-Harmony
        isInteger: t, // ES-Harmony
        isNaN: j, // ES-Harmony
        isSafeInteger: j, // ES-Harmony
        MAX_SAFE_INTEGER: j, // ES-Harmony
        MAX_VALUE: t,
        MIN_SAFE_INTEGER: j, // ES-Harmony
        MIN_VALUE: t,
        NaN: t,
        NEGATIVE_INFINITY: t,
        parseFloat: t, // ES-Harmony
        parseInt: t, // ES-Harmony
        POSITIVE_INFINITY: t,
        prototype: {
          toExponential: t,
          toFixed: t,
          toPrecision: t,
        },
      },

      Math: {
        // 20.2
        E: j,
        LN10: j,
        LN2: j,
        LOG10E: t,
        LOG2E: t,
        PI: j,
        SQRT1_2: t,
        SQRT2: t,

        abs: j,
        acos: t,
        acosh: t, // ES-Harmony
        asin: t,
        asinh: t, // ES-Harmony
        atan: t,
        atanh: t, // ES-Harmony
        atan2: t,
        cbrt: t, // ES-Harmony
        ceil: j,
        clz32: t, // ES-Harmony
        cos: t,
        cosh: t, // ES-Harmony
        exp: t,
        expm1: t, // ES-Harmony
        floor: j,
        fround: t, // ES-Harmony
        hypot: t, // ES-Harmony
        imul: t, // ES-Harmony
        log: j,
        log1p: t, // ES-Harmony
        log10: j, // ES-Harmony
        log2: j, // ES-Harmony
        max: j,
        min: j,
        pow: j,
        random: t, // questionable
        round: j,
        sign: t, // ES-Harmony
        sin: t,
        sinh: t, // ES-Harmony
        sqrt: j,
        tan: t,
        tanh: t, // ES-Harmony
        trunc: j, // ES-Harmony
      },

      // no-arg Date constructor is questionable
      Date: {
        // 20.3
        now: t, // questionable
        parse: t,
        UTC: t,
        prototype: {
          // Note: coordinate this list with maintanence of repairES5.js
          getDate: t,
          getDay: t,
          getFullYear: t,
          getHours: t,
          getMilliseconds: t,
          getMinutes: t,
          getMonth: t,
          getSeconds: t,
          getTime: t,
          getTimezoneOffset: t,
          getUTCDate: t,
          getUTCDay: t,
          getUTCFullYear: t,
          getUTCHours: t,
          getUTCMilliseconds: t,
          getUTCMinutes: t,
          getUTCMonth: t,
          getUTCSeconds: t,
          setDate: t,
          setFullYear: t,
          setHours: t,
          setMilliseconds: t,
          setMinutes: t,
          setMonth: t,
          setSeconds: t,
          setTime: t,
          setUTCDate: t,
          setUTCFullYear: t,
          setUTCHours: t,
          setUTCMilliseconds: t,
          setUTCMinutes: t,
          setUTCMonth: t,
          setUTCSeconds: t,
          toDateString: t,
          toISOString: t,
          toJSON: t,
          toLocaleDateString: t,
          toLocaleString: t,
          toLocaleTimeString: t,
          toTimeString: t,
          toUTCString: t,

          // B.2.4
          getYear: t,
          setYear: t,
          toGMTString: t,
        },
      },

      // 21 Text Processing

      String: {
        // 21.2
        fromCharCode: j,
        fromCodePoint: t, // ES-Harmony
        raw: j, // ES-Harmony
        prototype: {
          charAt: t,
          charCodeAt: t,
          codePointAt: t, // ES-Harmony
          concat: t,
          endsWith: j, // ES-Harmony
          includes: t, // ES-Harmony
          indexOf: j,
          lastIndexOf: j,
          localeCompare: t,
          match: t,
          normalize: t, // ES-Harmony
          padEnd: t, // ES-Harmony
          padStart: t, // ES-Harmony
          repeat: t, // ES-Harmony
          replace: t,
          search: t,
          slice: j,
          split: t,
          startsWith: j, // ES-Harmony
          substring: t,
          toLocaleLowerCase: t,
          toLocaleUpperCase: t,
          toLowerCase: t,
          toUpperCase: t,
          trim: t,

          // B.2.3
          substr: t,
          anchor: t,
          big: t,
          blink: t,
          bold: t,
          fixed: t,
          fontcolor: t,
          fontsize: t,
          italics: t,
          link: t,
          small: t,
          strike: t,
          sub: t,
          sup: t,

          trimLeft: t, // non-standard
          trimRight: t, // non-standard

          // 21.1.4 instances
          length: '*',
        },
      },

      RegExp: {
        // 21.2
        prototype: {
          exec: t,
          flags: 'maybeAccessor',
          global: 'maybeAccessor',
          ignoreCase: 'maybeAccessor',
          [Symbol.match]: '*', // ES-Harmony
          multiline: 'maybeAccessor',
          [Symbol.replace]: '*', // ES-Harmony
          [Symbol.search]: '*', // ES-Harmony
          source: 'maybeAccessor',
          [Symbol.split]: '*', // ES-Harmony
          sticky: 'maybeAccessor',
          test: t,
          unicode: 'maybeAccessor', // ES-Harmony
          dotAll: 'maybeAccessor', // proposed ES-Harmony

          // B.2.5
          compile: false, // UNSAFE. Purposely suppressed

          // 21.2.6 instances
          lastIndex: '*',
          options: '*', // non-std
        },
      },

      // 22 Indexed Collections

      Array: {
        // 22.1
        from: j,
        isArray: t,
        of: j, // ES-Harmony?
        prototype: {
          concat: t,
          copyWithin: t, // ES-Harmony
          entries: t, // ES-Harmony
          every: t,
          fill: t, // ES-Harmony
          filter: j,
          find: t, // ES-Harmony
          findIndex: t, // ES-Harmony
          forEach: j,
          includes: t, // ES-Harmony
          indexOf: j,
          join: t,
          keys: t, // ES-Harmony
          lastIndexOf: j,
          map: j,
          pop: j,
          push: j,
          reduce: j,
          reduceRight: j,
          reverse: t,
          shift: j,
          slice: j,
          some: t,
          sort: t,
          splice: t,
          unshift: j,
          values: t, // ES-Harmony

          // 22.1.4 instances
          length: '*',
        },
      },

      // 22.2 Typed Array stuff
      // TODO: Not yet organized according to spec order

      Int8Array: TypedArrayWhitelist,
      Uint8Array: TypedArrayWhitelist,
      Uint8ClampedArray: TypedArrayWhitelist,
      Int16Array: TypedArrayWhitelist,
      Uint16Array: TypedArrayWhitelist,
      Int32Array: TypedArrayWhitelist,
      Uint32Array: TypedArrayWhitelist,
      Float32Array: TypedArrayWhitelist,
      Float64Array: TypedArrayWhitelist,

      // 23 Keyed Collections          all ES-Harmony

      Map: {
        // 23.1
        prototype: {
          clear: j,
          delete: j,
          entries: j,
          forEach: j,
          get: j,
          has: j,
          keys: j,
          set: j,
          size: 'maybeAccessor',
          values: j,
        },
      },

      Set: {
        // 23.2
        prototype: {
          add: j,
          clear: j,
          delete: j,
          entries: j,
          forEach: j,
          has: j,
          keys: j,
          size: 'maybeAccessor',
          values: j,
        },
      },

      WeakMap: {
        // 23.3
        prototype: {
          // Note: coordinate this list with maintenance of repairES5.js
          delete: j,
          get: j,
          has: j,
          set: j,
        },
      },

      WeakSet: {
        // 23.4
        prototype: {
          add: j,
          delete: j,
          has: j,
        },
      },

      // 24 Structured Data

      ArrayBuffer: {
        // 24.1            all ES-Harmony
        isView: t,
        length: t, // does not inherit from Function.prototype on Chrome
        name: t, // ditto
        prototype: {
          byteLength: 'maybeAccessor',
          slice: t,
        },
      },

      // 24.2 TODO: Omitting SharedArrayBuffer for now

      DataView: {
        // 24.3               all ES-Harmony
        length: t, // does not inherit from Function.prototype on Chrome
        name: t, // ditto
        BYTES_PER_ELEMENT: '*', // non-standard. really?
        prototype: {
          buffer: 'maybeAccessor',
          byteOffset: 'maybeAccessor',
          byteLength: 'maybeAccessor',
          getFloat32: t,
          getFloat64: t,
          getInt8: t,
          getInt16: t,
          getInt32: t,
          getUint8: t,
          getUint16: t,
          getUint32: t,
          setFloat32: t,
          setFloat64: t,
          setInt8: t,
          setInt16: t,
          setInt32: t,
          setUint8: t,
          setUint16: t,
          setUint32: t,
        },
      },

      // 24.4 TODO: Omitting Atomics for now

      JSON: {
        // 24.5
        parse: j,
        stringify: j,
      },

      // 25 Control Abstraction Objects

      Promise: {
        // 25.4
        all: j,
        race: j,
        reject: j,
        resolve: j,
        prototype: {
          catch: t,
          then: j,
          finally: t, // proposed ES-Harmony

          // nanoq.js
          get: t,
          put: t,
          del: t,
          post: t,
          invoke: t,
          fapply: t,
          fcall: t,

          // Temporary compat with the old makeQ.js
          send: t,
          delete: t,
          end: t,
        },
      },

      // nanoq.js
      Q: {
        all: t,
        race: t,
        reject: t,
        resolve: t,

        join: t,
        isPassByCopy: t,
        passByCopy: t,
        makeRemote: t,
        makeFar: t,

        // Temporary compat with the old makeQ.js
        shorten: t,
        isPromise: t,
        async: t,
        rejected: t,
        promise: t,
        delay: t,
        memoize: t,
        defer: t,
      },

      // 26 Reflection

      Reflect: {
        // 26.1
        apply: t,
        construct: t,
        defineProperty: t,
        deleteProperty: t,
        get: t,
        getOwnPropertyDescriptor: t,
        getPrototypeOf: t,
        has: t,
        isExtensible: t,
        ownKeys: t,
        preventExtensions: t,
        set: t,
        setPrototypeOf: t,
      },

      Proxy: {
        // 26.2
        revocable: t,
      },

      // Appendix B

      // B.2.1
      escape: t,
      unescape: t,

      // B.2.5 (RegExp.prototype.compile) is marked 'false' up in 21.2

      // Other

      StringMap: {
        // A specialized approximation of ES-Harmony's Map.
        prototype: {}, // Technically, the methods should be on the prototype,
        // but doing so while preserving encapsulation will be
        // needlessly expensive for current usage.
      },

      Realm: {
        makeRootRealm: t,
        makeCompartment: t,
        prototype: {
          global: 'maybeAccessor',
          evaluate: t,
        },
      },

      SES: {
        confine: t,
        confineExpr: t,
      },

      Nat: j,
      def: j,
    },
  };

  // Copyright (C) 2011 Google Inc.

  const { create, getOwnPropertyDescriptors } = Object;

  function buildTable(global) {
    // walk global object, add whitelisted properties to table

    const uncurryThis = fn => (thisArg, ...args) =>
      Reflect.apply(fn, thisArg, args);
    const {
      getOwnPropertyDescriptor: gopd,
      getOwnPropertyNames: gopn,
      keys,
    } = Object;
    const getProto = Object.getPrototypeOf;
    const hop = uncurryThis(Object.prototype.hasOwnProperty);

    const whiteTable = new Map();

    function addToWhiteTable(rootValue, rootPermit) {
      /**
       * The whiteTable should map from each path-accessible primordial
       * object to the permit object that describes how it should be
       * cleaned.
       *
       * We initialize the whiteTable only so that {@code getPermit} can
       * process "*" inheritance using the whitelist, by walking actual
       * inheritance chains.
       */
      const whitelistSymbols = [true, false, '*', 'maybeAccessor'];
      function register(value, permit) {
        if (value !== Object(value)) {
          return;
        }
        if (typeof permit !== 'object') {
          if (whitelistSymbols.indexOf(permit) < 0) {
            throw new Error(
              `syntax error in whitelist; unexpected value: ${permit}`,
            );
          }
          return;
        }
        if (whiteTable.has(value)) {
          throw new Error('primordial reachable through multiple paths');
        }
        whiteTable.set(value, permit);
        keys(permit).forEach(name => {
          // Use gopd to avoid invoking an accessor property.
          // Accessor properties for which permit !== 'maybeAccessor'
          // are caught later by clean().
          const desc = gopd(value, name);
          if (desc) {
            register(desc.value, permit[name]);
          }
        });
      }
      register(rootValue, rootPermit);
    }

    /**
     * Should the property named {@code name} be whitelisted on the
     * {@code base} object, and if so, with what Permit?
     *
     * <p>If it should be permitted, return the Permit (where Permit =
     * true | "maybeAccessor" | "*" | Record(Permit)), all of which are
     * truthy. If it should not be permitted, return false.
     */
    function getPermit(base, name) {
      let permit = whiteTable.get(base);
      if (permit) {
        if (hop(permit, name)) {
          return permit[name];
        }
      }
      // eslint-disable-next-line no-constant-condition
      while (true) {
        base = getProto(base); // eslint-disable-line no-param-reassign
        if (base === null) {
          return false;
        }
        permit = whiteTable.get(base);
        if (permit && hop(permit, name)) {
          const result = permit[name];
          if (result === '*') {
            return result;
          }
          return false;
        }
      }
    }

    const fringeTable = new Set();
    /**
     * Walk the table, adding everything that's on the whitelist to a Set for
       later use.
     *
     */
    function addToFringeTable(value, prefix) {
      if (value !== Object(value)) {
        return;
      }
      if (fringeTable.has(value)) {
        return;
      }

      fringeTable.add(value);
      gopn(value).forEach(name => {
        const path = prefix + (prefix ? '.' : '') + name;
        const p = getPermit(value, name);
        if (p) {
          const desc = gopd(value, name);
          if (hop(desc, 'value')) {
            // Is a data property
            const subValue = desc.value;
            addToFringeTable(subValue, path);
          }
        }
      });
    }

    // To avoid including the global itself in this set, we make a new object
    // that has all the same properties. In SES, we'll freeze the global
    // separately.
    const globals = create(null, getOwnPropertyDescriptors(global));
    addToWhiteTable(globals, whitelist.namedIntrinsics);
    const intrinsics = getAnonIntrinsics(global);
    addToWhiteTable(intrinsics, whitelist.anonIntrinsics);
    // whiteTable is now a map from objects to a 'permit'

    // getPermit() is a non-recursive function taking (obj, propname) and
    // returning a permit

    // addToFringeTable() does a recursive property walk of its first argument,
    // finds everything that getPermit() allows, and puts them all into the Set
    // named 'fringeTable'

    addToFringeTable(globals, '');
    addToFringeTable(intrinsics, '');
    return fringeTable;
  }

  // Adapted from SES/Caja - Copyright (C) 2011 Google Inc.

  // this use of 'global' is why Harden is a "resource module", whereas
  // MakeHardener is "pure".
  const initialRoots = buildTable((0, eval)('this')); // eslint-disable-line no-eval
  // console.log('initialRoots are', initialRoots);

  const harden = makeHardener(initialRoots);

  return harden;

}));

},{}],"1dyn":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.confine = exports.confineExpr = exports.$h_sourceURLLength = void 0;

var _harden = _interopRequireDefault(require("@agoric/harden"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let _sourceURLLength = -1;

const $h_sourceURLLength = (0, _harden.default)(len => _sourceURLLength = len);
exports.$h_sourceURLLength = $h_sourceURLLength;

const dataSource = src => {
  if (_sourceURLLength >= 0) {
    if (src.length > _sourceURLLength) {
      src = src.slice(0, _sourceURLLength) + '...';
    } else {
      src = src.slice(0, _sourceURLLength);
    }
  }

  return `data:${encodeURIComponent(src)}`;
};
/**
 * The faux version of SES's <tt>confineExpr</tt> evals an
 * expression in an environment consisting of the global environment
 * as enhanced and shadowed by the own properties of the
 * <tt>env</tt> object. Unlike real <tt>confineExpr</tt>, <ul>
 * <li>The faux <tt>confineExpr</tt> does not have a third
 *     <tt>opt_options</tt> parameter. An options argument can of
 *     course be provided by the caller, but it will be ignored.
 * <li>The expression can be in the subset of ES6 supported by
 *     Babel.
 * <li>All dangerous globals that are not shadowed, such as "window"
 *     or "document", are still accessible by the evaled expression.
 * <li>The current binding of these properties at the time that
 *     <tt>confineExpr</tt> is called are used as the initial
 *     bindings. Further changes to either the properties or the
 *     bindings are not tracked by the other.
 * <li>In the evaled expression, <tt>this</tt> is bound to
 *     <tt>undefined</tt>.
 * </ul>
 */


const confineExpr = (0, _harden.default)((exprSrc, env) => {
  exprSrc = '' + exprSrc;
  const names = Object.getOwnPropertyNames(env); // Note: no newline prior to ${exprSrc}, so that line numbers for
  // errors within exprSrc are accurate. Column numbers on the first
  // line won't be, but will on following lines.

  const closedFuncSrc = `(function(${names.join(',')}) { "use strict"; return (${exprSrc}
  );
  })
  //# sourceURL=${dataSource(exprSrc)}
  `;
  const closedFunc = (1, eval)(closedFuncSrc);
  return closedFunc(...names.map(n => env[n]));
});
/**
 * The faux version of confine is similar to confineExpr, but is for
 * statements.  It returns undefined (or throws).
 */

exports.confineExpr = confineExpr;
const confine = (0, _harden.default)((src, env) => {
  src = '' + src;
  const names = Object.getOwnPropertyNames(env); // Note: no newline prior to ${src}, so that line numbers for
  // errors within src are accurate. Column numbers on the first
  // line won't be, but will on following lines.

  const closedFuncSrc = `(function(${names.join(',')}) { "use strict"; ${src}
  ;
  })
  //# sourceURL=${dataSource(src)}
  `;
  const closedFunc = (1, eval)(closedFuncSrc);
  closedFunc(...names.map(n => env[n])); // We return nothing.
});
exports.confine = confine;
},{"@agoric/harden":"t+IF"}],"zfHG":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeWeakSet = exports.makeWeakMap = exports.makeSet = exports.makeMap = exports.makePromise = void 0;

var _harden = _interopRequireDefault(require("@agoric/harden"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const makePromise = (0, _harden.default)(executor => (0, _harden.default)(new Promise(executor)));
exports.makePromise = makePromise;
const makeMap = (0, _harden.default)(entriesOrIterable => (0, _harden.default)(new Map(entriesOrIterable)));
exports.makeMap = makeMap;
const makeSet = (0, _harden.default)(values => (0, _harden.default)(new Set(values)));
exports.makeSet = makeSet;
const makeWeakMap = (0, _harden.default)(entries => (0, _harden.default)(new WeakMap(entries)));
exports.makeWeakMap = makeWeakMap;
const makeWeakSet = (0, _harden.default)(values => (0, _harden.default)(new WeakSet(values)));
exports.makeWeakSet = makeWeakSet;
},{"@agoric/harden":"t+IF"}],"63Wy":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.$h_already = void 0;

var _harden = _interopRequireDefault(require("@agoric/harden"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Prevent write access, and ensure objects don't pass the barrier
// between warm (inside warmTarget or the return values of its descendants)
// and cold (outside warmTarget), unless they are also insulated.
//
// The cold/warm identity maps are created fresh for each actual insulate()
// call, but not for the silent wrapping of returns, throws, this, and
// arguments.  This allows wrapping/unwrapping of values that transition
// the delineated insulation boundary with read-only Proxies rather
// having to harden them on every transition and losing useful but
// harmless mutability.
//
// The proxying provided by insulate() is orthogonal to harden() and
// Object.freeze.  You can still call harden() on your own data and
// pass it into insulated() functions, but not on proxies that have
// originated in an insulated() function, as that data belongs to
// somebody else).
// The $h_uninsulated set is a list of global identities that should never
// be wrapped.  It is included for bootstrap purposes, but MUST NOT
// be exportd to Jessie.
//
// The `$h_` prefix is a safeguard to prevent valid Jessie code from ever
// referencing this set as an identifier.
const $h_already = (0, _harden.default)(new WeakSet());
exports.$h_already = $h_already;
const insulate = (0, _harden.default)(warmTarget => {
  const warmToColdMap = new WeakMap(),
        coldToWarmMap = new WeakMap();

  const wrapWithMaps = (obj, inMap, outMap) => {
    if (Object(obj) !== obj) {
      // It's a neutral (primitive) type.
      return obj;
    } // We are sending out the object, so find it in the cache.


    const wrapped = outMap.get(obj);

    if (wrapped) {
      return wrapped;
    }

    if ($h_already.has(obj)) {
      // Don't doubly insulate.
      return obj;
    } // If we want an object to come in, we reverse the map (our
    // inside is the object's outside).


    const enter = inbound => wrapWithMaps(inbound, outMap, inMap); // If we want send an object out, we keep the order (our inside
    // is the object's inside).


    const leave = outThunk => {
      try {
        return wrapWithMaps(outThunk(), inMap, outMap);
      } catch (e) {
        throw wrapWithMaps(e, inMap, outMap);
      }
    };

    const err = msg => leave(() => {
      throw wrapWithMaps(TypeError(msg), inMap, outMap);
    });

    const handler = {
      // Traps that make sure our object is read-only.
      defineProperty(_target, prop, _attributes) {
        throw err(`Cannot define property ${JSON.stringify(String(prop))} on insulated object`);
      },

      setPrototypeOf(_target, _v) {
        throw err(`Cannot set prototype of insulated object`);
      },

      set(_target, prop, _value) {
        throw err(`Cannot set property ${JSON.stringify(String(prop))} on insulated object`);
      },

      // Traps that we default:
      // isExtensible(target)
      // getOwnPropertyDescriptor(target, prop)
      // We prevent freezing because we don't want to modify
      // the target object AT ALL!
      preventExtensions(target) {
        if (!Reflect.isExtensible(target)) {
          // Already prevented extensions, so succeed.
          return true;
        } // This is a mutation.  Not allowed.


        throw err(`Cannot prevent extensions of insulated object`);
      },

      // The traps that have a reasonably simple implementation:
      get(target, prop, receiver) {
        const desc = Reflect.getOwnPropertyDescriptor(target, prop);
        const value = Reflect.get(target, prop, receiver);

        if (desc && !desc.writable && !desc.configurable) {
          return value;
        }

        return leave(() => value);
      },

      getPrototypeOf(target) {
        return leave(() => Reflect.getPrototypeOf(target));
      },

      ownKeys(target) {
        return leave(() => Reflect.ownKeys(target));
      },

      has(target, key) {
        return leave(() => key in target);
      },

      // The recursively-wrapping traps.
      apply(target, thisArg, argumentsList) {
        // If the target method is from outside, but thisArg is not from outside,
        // nor already exported to outside, we have insulation-crossing `this` capture.
        if (Object(thisArg) === thisArg && outMap.get(target) && !inMap.get(thisArg) && !outMap.get(thisArg)) {
          // Block accidental `this`-capture, but don't break
          // callers that ignore `this` anyways.
          thisArg = undefined;
        }

        const wrappedThis = enter(thisArg);
        const wrappedArguments = argumentsList.map(enter);
        return leave(() => Reflect.apply(target, wrappedThis, wrappedArguments));
      },

      construct(target, args) {
        const wrappedArguments = args.map(enter);
        return leave(() => Reflect.construct(target, wrappedArguments));
      }

    }; // Now we can construct an insulated object, which
    // makes it effectively read-only and transitively
    // maintains the temperatures of the inside and outside.

    const insulated = new Proxy(obj, handler); // Prevent double-insulation.

    $h_already.add(insulated); // We're putting the insulated object outside, so mark it
    // for our future inputs/outputs.

    outMap.set(obj, insulated);
    inMap.set(insulated, obj);
    return insulated;
  };

  return wrapWithMaps(warmTarget, coldToWarmMap, warmToColdMap);
}); // Prevent infinite regress.

$h_already.add(insulate);
var _default = insulate;
exports.default = _default;
},{"@agoric/harden":"t+IF"}],"YilW":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "confine", {
  enumerable: true,
  get: function () {
    return _confine.confine;
  }
});
Object.defineProperty(exports, "confineExpr", {
  enumerable: true,
  get: function () {
    return _confine.confineExpr;
  }
});
Object.defineProperty(exports, "makePromise", {
  enumerable: true,
  get: function () {
    return _makers.makePromise;
  }
});
Object.defineProperty(exports, "makeMap", {
  enumerable: true,
  get: function () {
    return _makers.makeMap;
  }
});
Object.defineProperty(exports, "makeSet", {
  enumerable: true,
  get: function () {
    return _makers.makeSet;
  }
});
Object.defineProperty(exports, "makeWeakMap", {
  enumerable: true,
  get: function () {
    return _makers.makeWeakMap;
  }
});
Object.defineProperty(exports, "makeWeakSet", {
  enumerable: true,
  get: function () {
    return _makers.makeWeakSet;
  }
});
Object.defineProperty(exports, "harden", {
  enumerable: true,
  get: function () {
    return _harden.default;
  }
});
Object.defineProperty(exports, "insulate", {
  enumerable: true,
  get: function () {
    return _insulate.default;
  }
});

var _confine = require("./confine.mjs");

var _makers = require("./makers.mjs");

var _harden = _interopRequireDefault(require("@agoric/harden"));

var _insulate = _interopRequireDefault(require("./insulate.mjs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
},{"./confine.mjs":"1dyn","./makers.mjs":"zfHG","@agoric/harden":"t+IF","./insulate.mjs":"63Wy"}],"g5I+":[function(require,module,exports) {

// shim for using process in browser
var process = module.exports = {}; // cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
  throw new Error('setTimeout has not been defined');
}

function defaultClearTimeout() {
  throw new Error('clearTimeout has not been defined');
}

(function () {
  try {
    if (typeof setTimeout === 'function') {
      cachedSetTimeout = setTimeout;
    } else {
      cachedSetTimeout = defaultSetTimout;
    }
  } catch (e) {
    cachedSetTimeout = defaultSetTimout;
  }

  try {
    if (typeof clearTimeout === 'function') {
      cachedClearTimeout = clearTimeout;
    } else {
      cachedClearTimeout = defaultClearTimeout;
    }
  } catch (e) {
    cachedClearTimeout = defaultClearTimeout;
  }
})();

function runTimeout(fun) {
  if (cachedSetTimeout === setTimeout) {
    //normal enviroments in sane situations
    return setTimeout(fun, 0);
  } // if setTimeout wasn't available but was latter defined


  if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
    cachedSetTimeout = setTimeout;
    return setTimeout(fun, 0);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedSetTimeout(fun, 0);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
      return cachedSetTimeout.call(null, fun, 0);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
      return cachedSetTimeout.call(this, fun, 0);
    }
  }
}

function runClearTimeout(marker) {
  if (cachedClearTimeout === clearTimeout) {
    //normal enviroments in sane situations
    return clearTimeout(marker);
  } // if clearTimeout wasn't available but was latter defined


  if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
    cachedClearTimeout = clearTimeout;
    return clearTimeout(marker);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedClearTimeout(marker);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
      return cachedClearTimeout.call(null, marker);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
      // Some versions of I.E. have different rules for clearTimeout vs setTimeout
      return cachedClearTimeout.call(this, marker);
    }
  }
}

var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
  if (!draining || !currentQueue) {
    return;
  }

  draining = false;

  if (currentQueue.length) {
    queue = currentQueue.concat(queue);
  } else {
    queueIndex = -1;
  }

  if (queue.length) {
    drainQueue();
  }
}

function drainQueue() {
  if (draining) {
    return;
  }

  var timeout = runTimeout(cleanUpNextTick);
  draining = true;
  var len = queue.length;

  while (len) {
    currentQueue = queue;
    queue = [];

    while (++queueIndex < len) {
      if (currentQueue) {
        currentQueue[queueIndex].run();
      }
    }

    queueIndex = -1;
    len = queue.length;
  }

  currentQueue = null;
  draining = false;
  runClearTimeout(timeout);
}

process.nextTick = function (fun) {
  var args = new Array(arguments.length - 1);

  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }
  }

  queue.push(new Item(fun, args));

  if (queue.length === 1 && !draining) {
    runTimeout(drainQueue);
  }
}; // v8 likes predictible objects


function Item(fun, array) {
  this.fun = fun;
  this.array = array;
}

Item.prototype.run = function () {
  this.fun.apply(null, this.array);
};

process.title = 'browser';
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues

process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) {
  return [];
};

process.binding = function (name) {
  throw new Error('process.binding is not supported');
};

process.cwd = function () {
  return '/';
};

process.chdir = function (dir) {
  throw new Error('process.chdir is not supported');
};

process.umask = function () {
  return 0;
};
},{}],"Ipmo":[function(require,module,exports) {
var define;
var global = arguments[3];
var process = require("process");
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.slog = {}));
}(this, function (exports) { 'use strict';

    var SlogLevel;
    (function (SlogLevel) {
        SlogLevel[SlogLevel["reject"] = -2] = "reject";
        SlogLevel[SlogLevel["stringify"] = -1] = "stringify";
        SlogLevel[SlogLevel["panic"] = 0] = "panic";
        SlogLevel[SlogLevel["alert"] = 1] = "alert";
        SlogLevel[SlogLevel["crit"] = 2] = "crit";
        SlogLevel[SlogLevel["error"] = 3] = "error";
        SlogLevel[SlogLevel["warn"] = 4] = "warn";
        SlogLevel[SlogLevel["notice"] = 5] = "notice";
        SlogLevel[SlogLevel["info"] = 6] = "info";
        SlogLevel[SlogLevel["debug"] = 7] = "debug";
        SlogLevel[SlogLevel["trace"] = 8] = "trace";
    })(SlogLevel || (SlogLevel = {}));
    const contextArg = (context, a) => {
        if (typeof a !== 'object' || a === null) {
            // Just stringify the argument.
            return '' + a;
        }
        else if (a.length !== undefined) {
            // Take the value as the (anonymous) array.
            return a;
        }
        // Deconstruct the argument object.
        let valname, val;
        for (const vname of Object.keys(a)) {
            if (vname === 'format') ;
            else if (valname !== undefined || typeof a[vname] === 'function') {
                // Too many members or seems to be an active object.
                return a;
            }
            else {
                // We have at least one non-format member.
                valname = vname;
                val = JSON.stringify(a[vname], undefined, 2);
            }
        }
        if (valname === undefined) {
            // No non-format arguments.
            return a;
        }
        if (valname[0] === '_') ;
        else if (valname in context) {
            const oval = context[valname];
            if (val !== oval) {
                slog.error `Context value ${{ valname }} mismatch: ${{ val }} vs. ${{ oval }}`;
            }
        }
        else {
            context[valname] = val;
        }
        return val;
    };
    const makeSlog = (makeHandler) => {
        const doit = (level, name) => {
            const handler = makeHandler(level, name);
            function tag(contextOrTemplate, ...args) {
                if (!contextOrTemplate.raw) {
                    const c = { ...contextOrTemplate };
                    return (t, ...a) => handler(c, t, a);
                }
                // No specified context, this is the template tag.
                const context = new Map();
                const template = contextOrTemplate;
                return handler(context, template, args);
            }
            return tag;
        };
        const slog = doit(SlogLevel.stringify, 'stringify');
        slog.panic = doit(SlogLevel.panic, 'panic');
        slog.alert = doit(SlogLevel.alert, 'alert');
        slog.crit = doit(SlogLevel.crit, 'crit');
        slog.error = doit(SlogLevel.error, 'error');
        slog.reject = doit(SlogLevel.reject, 'reject');
        slog.warn = doit(SlogLevel.warn, 'warn');
        slog.notice = doit(SlogLevel.notice, 'notice');
        slog.info = doit(SlogLevel.info, 'info');
        slog.debug = doit(SlogLevel.debug, 'debug');
        slog.trace = doit(SlogLevel.trace, 'trace');
        return slog;
    };
    const defaultMakeHandler = (rawLevel, name) => {
        const level = rawLevel;
        const prefix = level < 0 ? '' : name + ': ';
        return (context, template, args) => {
            let ca;
            const reduced = args.reduce((prior, a, i) => {
                ca = contextArg(context, a);
                const last = prior[prior.length - 1];
                if (typeof ca === 'object' && ca !== undefined) {
                    prior[prior.length - 1] = last.trimRight();
                    prior.push(ca, template[i + 1].trimLeft());
                }
                else {
                    prior[prior.length - 1] = last + String(ca) + template[i + 1];
                }
                return prior;
            }, [prefix + template[0]]);
            if (level === SlogLevel.reject) {
                // Just return a promise rejection.
                return Promise.reject(reduced.join(' '));
            }
            else if (level < 0) {
                // Just stringify.
                return reduced.join(' ');
            }
            if (level >= SlogLevel.warn) {
                // Use console.error to provide an inspectable result in the
                // browser without polluting stdout on Node.
                console.error(...reduced);
            }
            else {
                // Record a location, too.
                const at0 = new Error().stack;
                console.error(...reduced, at0);
            }
            if (level <= SlogLevel.panic && typeof process !== 'undefined') {
                // Exit the process.
                process.exit(99);
            }
            else if (level <= SlogLevel.alert && typeof alert !== 'undefined') {
                alert(reduced.join(' '));
            }
            else if (level <= SlogLevel.error) {
                // Throw an exception without revealing stack.
                throw reduced.join(' ');
            }
            // Return nothing.
        };
    };
    const slog = makeSlog(defaultMakeHandler);

    exports.contextArg = contextArg;
    exports.defaultMakeHandler = defaultMakeHandler;
    exports.makeSlog = makeSlog;
    exports.slog = slog;

    Object.defineProperty(exports, '__esModule', { value: true });

}));

},{"process":"g5I+"}],"cE9W":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _jessie = require("@agoric/jessie");

var indent = (0, _jessie.insulate)(function (template) {
  var result = [];
  var newnewline = '\n';

  for (var _len = arguments.length, substs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    substs[_key - 1] = arguments[_key];
  }

  for (var i = 0, ilen = substs.length; i < ilen; i++) {
    var segment = template[i];

    if (i === 0 && segment[0].startsWith('\n')) {
      segment = segment.slice(1);
    }

    var lastnl = segment.lastIndexOf('\n');

    if (lastnl >= 0) {
      newnewline = '\n';

      for (var j = segment.length - lastnl; j > 0; j--) {
        newnewline += ' ';
      }
    }

    result.push(segment); // We don't have regexps at our disposal in Jessie.

    String(substs[i]).split('\n').forEach(function (subst, j) {
      if (j !== 0) {
        result.push(newnewline);
      }

      result.push(subst);
    });
  }

  result.push(template[substs.length]);
  return result.join('');
});
var _default = indent;
exports.default = _default;
},{"@agoric/jessie":"YilW"}],"QgFk":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _jessie = require("@agoric/jessie");

var _slog = require("@michaelfig/slog");

var _indent = _interopRequireDefault(require("./indent.mjs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _templateObject32() {
  var data = _taggedTemplateLiteral(["reparsedPegAst does not match src/boot-pegast.mjs.ts"]);

  _templateObject32 = function _templateObject32() {
    return data;
  };

  return data;
}

function _templateObject31() {
  var data = _taggedTemplateLiteral(["// boot-pegast.mjs.ts - AUTOMATICALLY GENERATED by boot-peg.mjs.ts\nexport default ", ";"], ["// boot-pegast.mjs.ts - AUTOMATICALLY GENERATED by boot-peg.mjs.ts\\nexport default ", ";"]);

  _templateObject31 = function _templateObject31() {
    return data;
  };

  return data;
}

function _templateObject30() {
  var data = _taggedTemplateLiteral(["Cannot curry baseParserCreator"]);

  _templateObject30 = function _templateObject30() {
    return data;
  };

  return data;
}

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _templateObject29() {
  var data = _taggedTemplateLiteral(["", ": ", ""]);

  _templateObject29 = function _templateObject29() {
    return data;
  };

  return data;
}

function _templateObject28() {
  var data = _taggedTemplateLiteral(["Unrecognized tag flag ", ""]);

  _templateObject28 = function _templateObject28() {
    return data;
  };

  return data;
}

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _templateObject27() {
  var data = _taggedTemplateLiteral(["Cannot find ", " in vtable"]);

  _templateObject27 = function _templateObject27() {
    return data;
  };

  return data;
}

function _templateObject26() {
  var data = _taggedTemplateLiteral(["\n    ", " = pos;\n    ", "\n    value = (value === FAIL) ? SKIP : FAIL;\n    pos = ", ";"]);

  _templateObject26 = function _templateObject26() {
    return data;
  };

  return data;
}

function _templateObject25() {
  var data = _taggedTemplateLiteral(["\n    ", " = pos;\n    ", "\n    if (value !== FAIL) {\n        value = SKIP;\n    }\n    pos = ", ";"]);

  _templateObject25 = function _templateObject25() {
    return data;
  };

  return data;
}

function _templateObject24() {
  var data = _taggedTemplateLiteral(["\n    [pos, value] = EAT(self, pos, ", ");\n    "]);

  _templateObject24 = function _templateObject24() {
    return data;
  };

  return data;
}

function _templateObject23() {
  var data = _taggedTemplateLiteral(["\n    [pos, value] = EAT(self, pos);\n                "]);

  _templateObject23 = function _templateObject23() {
    return data;
  };

  return data;
}

function _templateObject22() {
  var data = _taggedTemplateLiteral(["\n    [pos, value] = EAT(self, pos);\n    if (value !== FAIL) {\n        value = ", ".indexOf(value) ", " 0 ? FAIL : value;\n    }\n                "]);

  _templateObject22 = function _templateObject22() {
    return data;
  };

  return data;
}

function _templateObject21() {
  var data = _taggedTemplateLiteral(["\n    if (beginPos !== undefined) {\n        yytext = '';\n        while (beginPos < pos) {\n            [beginPos, value] = EAT(self, beginPos);\n            if (value === FAIL) {\n                break;\n            }\n            yytext += value;\n        }\n        beginPos = undefined;\n        value = [];\n    }"]);

  _templateObject21 = function _templateObject21() {
    return data;
  };

  return data;
}

function _templateObject20() {
  var data = _taggedTemplateLiteral(["\n    ", "\n    if (value.length === 0) value = FAIL;"]);

  _templateObject20 = function _templateObject20() {
    return data;
  };

  return data;
}

function _templateObject19() {
  var data = _taggedTemplateLiteral(["\n    ", " = [];\n    ", " = pos;\n    ", " = SKIP;\n    while (true) {\n      ", " = pos;\n      ", "\n      if (value === FAIL) {\n        pos = ", ";\n        break;\n      }\n      if (", " !== SKIP) ", ".push(", ");\n      if (value !== SKIP) ", ".push(value);\n      ", " = pos;\n      ", "\n      if (value === FAIL) break;\n      ", " = value;\n      if (pos === ", ") break;\n    }\n    value = ", ";"]);

  _templateObject19 = function _templateObject19() {
    return data;
  };

  return data;
}

function _templateObject18() {
  var data = _taggedTemplateLiteral(["\n    ", " = pos;\n    ", "\n    if (value !== FAIL) {\n        value = act_", "(...value);\n        if (Array.isArray(value)) {\n            value = [...value];\n            value._pegPosition = makeTokStr(self, FIND(self.template, ", "));\n        }\n    }"]);

  _templateObject18 = function _templateObject18() {
    return data;
  };

  return data;
}

function _templateObject17() {
  var data = _taggedTemplateLiteral(["\n    ", "\n    if (value !== FAIL && value.length === 1) value = value[0];"]);

  _templateObject17 = function _templateObject17() {
    return data;
  };

  return data;
}

function _templateObject16() {
  var data = _taggedTemplateLiteral(["\n    ", " = [];\n    ", " = FAIL;\n    ", " = pos;\n    ", ": {\n      let beginPos, yytext;\n      ", "\n      if (yytext !== undefined) {\n          ", " = [yytext];\n      }\n      else {\n        ", " = ", ";\n      }\n    }\n    if ((value = ", ") === FAIL) pos = ", ";"]);

  _templateObject16 = function _templateObject16() {
    return data;
  };

  return data;
}

function _templateObject15() {
  var data = _taggedTemplateLiteral(["\n    ", "\n    if (value === FAIL) break ", ";\n    if (value !== SKIP) ", ".push(value);"]);

  _templateObject15 = function _templateObject15() {
    return data;
  };

  return data;
}

function _templateObject14() {
  var data = _taggedTemplateLiteral(["\n    ", ": {\n      ", "\n    }"]);

  _templateObject14 = function _templateObject14() {
    return data;
  };

  return data;
}

function _templateObject13() {
  var data = _taggedTemplateLiteral(["\n    ", "\n    if (value !== FAIL) break ", ";"]);

  _templateObject13 = function _templateObject13() {
    return data;
  };

  return data;
}

function _templateObject12() {
  var data = _taggedTemplateLiteral(["\n    rule_", ": (self, pos) => {\n      ", "\n      ", "\n      return [pos, value];\n    },"]);

  _templateObject12 = function _templateObject12() {
    return data;
  };

  return data;
}

function _templateObject11() {
  var data = _taggedTemplateLiteral(["\n    (function(", ") {\n      let myHits = 0, myMisses = 0;\n      return baseMemo => (template, debug) => {\n          const BaseParser = baseMemo({});\n          return {...BaseParser,\n        template,\n        _memo: makeMap(),\n        _hits: (i) => myHits += i,\n        _misses: (i) => myMisses += i,\n        _debug: debug,\n        start: (self) => {\n          const pair = RUN(self, self.rule_", ", 0, ", ");\n          if (pair[1] === FAIL) {\n            ERROR(self, pair[0]);\n          }\n          return pair[1];\n        },\n        done: DONE,\n        ", "\n    }};\n    })\n    "]);

  _templateObject11 = function _templateObject11() {
    return data;
  };

  return data;
}

function _templateObject10() {
  var data = _taggedTemplateLiteral(["Invalid hexadecimal number ", ""]);

  _templateObject10 = function _templateObject10() {
    return data;
  };

  return data;
}

function _templateObject9() {
  var data = _taggedTemplateLiteral(["", "(", ") => [", ", ", "]"]);

  _templateObject9 = function _templateObject9() {
    return data;
  };

  return data;
}

function _templateObject8() {
  var data = _taggedTemplateLiteral(["", "(", ") => left recursion detector"]);

  _templateObject8 = function _templateObject8() {
    return data;
  };

  return data;
}

function _templateObject7() {
  var data = _taggedTemplateLiteral(["@", " => FAIL [", "]"]);

  _templateObject7 = function _templateObject7() {
    return data;
  };

  return data;
}

function _templateObject6() {
  var data = _taggedTemplateLiteral(["hits: ", ", misses: ", ""]);

  _templateObject6 = function _templateObject6() {
    return data;
  };

  return data;
}

function _templateObject5() {
  var data = _taggedTemplateLiteral(["Syntax error ", ""]);

  _templateObject5 = function _templateObject5() {
    return data;
  };

  return data;
}

function _templateObject4() {
  var data = _taggedTemplateLiteral(["-------template--------\n    ", "\n    -------\n    ", ""]);

  _templateObject4 = function _templateObject4() {
    return data;
  };

  return data;
}

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _templateObject3() {
  var data = _taggedTemplateLiteral(["Rule missing: ", ""]);

  _templateObject3 = function _templateObject3() {
    return data;
  };

  return data;
}

function _templateObject2() {
  var data = _taggedTemplateLiteral(["Left recursion on rule: ", ""]);

  _templateObject2 = function _templateObject2() {
    return data;
  };

  return data;
}

function _templateObject() {
  var data = _taggedTemplateLiteral(["run(f, ", ", ", ")"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var slog = (0, _jessie.insulate)(_slog.slog);
var indent = (0, _jessie.insulate)(_indent.default);
var LEFT_RECUR = (0, _jessie.insulate)({
  toString: function toString() {
    return 'LEFT_RECUR';
  }
});
var RUN = (0, _jessie.insulate)(function (self, ruleOrPatt, pos, name) {
  if (self._debug) {
    slog.info(_templateObject(), pos, name);
  }

  var posm = self._memo.get(pos);

  if (!posm) {
    posm = (0, _jessie.makeMap)();

    self._memo.set(pos, posm);
  }

  var result = posm.get(ruleOrPatt);

  if (result) {
    if (result === LEFT_RECUR) {
      slog.error(_templateObject2(), {
        name: name
      });
    }

    self._hits(1);
  } else {
    posm.set(ruleOrPatt, LEFT_RECUR);

    self._misses(1);

    if (typeof ruleOrPatt === 'function') {
      result = ruleOrPatt(self, pos);
    } else if (ruleOrPatt === void 0) {
      slog.error(_templateObject3(), name);
    } else {
      result = EAT(self, pos, ruleOrPatt);
    }

    posm.set(ruleOrPatt, result);
  }

  return result;
});
var lastFailures = (0, _jessie.insulate)(function (self) {
  var maxPos = 0;
  var fails = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = self._memo[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var posArr = _step.value;
      var posm = posArr[1];
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = posm[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _step2$value = _slicedToArray(_step2.value, 2),
              ruleOrPatt = _step2$value[0],
              result = _step2$value[1];

          if (result !== LEFT_RECUR) {
            var fail = typeof ruleOrPatt === 'function' ? ruleOrPatt.name.slice(5) : JSON.stringify('' + ruleOrPatt);

            var _result = _slicedToArray(result, 2),
                newPos = _result[0],
                v = _result[1];

            if (v === FAIL) {
              if (newPos > maxPos) {
                maxPos = newPos;
                fails = [fail];
              } else if (newPos === maxPos && fails.indexOf(fail) < 0) {
                fails.push(fail);
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return [maxPos, fails];
});
var ERROR = (0, _jessie.insulate)(function (self, _pos) {
  var _lastFailures = lastFailures(self),
      _lastFailures2 = _slicedToArray(_lastFailures, 2),
      last = _lastFailures2[0],
      fails = _lastFailures2[1];

  var found = FIND(self.template, last);
  var tokStr = Array.isArray(found) ? "at ".concat(last, " ").concat(makeTokStr(self, found)) : "unexpected EOF after ".concat(makeTokStr(self, FIND(self.template, last - 1)));
  var failStr = fails.length === 0 ? "stuck" : "looking for ".concat(fails.join(', '));
  var sources = self.template.sources;
  slog.info(_templateObject4(), self.template.raw.reduce(function (prior, r, i) {
    if (sources) {
      var s = sources[i];
      prior += "    ".concat(s.uri, ":").concat(s.line, ": ");
    }

    prior += JSON.stringify(r).slice(0, 50) + '\n';
    return prior;
  }, ''), failStr);
  slog.error(_templateObject5(), tokStr);
});
var makeTokStr = (0, _jessie.insulate)(function (self, found) {
  if (Array.isArray(found)) {
    var segment = self.template[found[0]];
    return "".concat(JSON.stringify(segment[found[1]]), " #").concat(found[0], ":").concat(found[1]);
  }

  if (typeof found === 'number') {
    return "hole #".concat(found);
  }

  return undefined;
});
var DONE = (0, _jessie.insulate)(function (self) {
  if (self._debug) {
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = self._memo[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var _step3$value = _slicedToArray(_step3.value, 2),
            pos = _step3$value[0],
            posm = _step3$value[1];

        var fails = [];
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = posm[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var _step4$value = _slicedToArray(_step4.value, 2),
                ruleOrPatt = _step4$value[0],
                result = _step4$value[1];

            var name = typeof ruleOrPatt === 'function' ? ruleOrPatt.name : JSON.stringify(ruleOrPatt);

            if (result === LEFT_RECUR) {
              slog.notice(_templateObject8(), name, pos);
            } else {
              var _result2 = _slicedToArray(result, 2),
                  newPos = _result2[0],
                  v = _result2[1];

              if (v === FAIL) {
                fails.push(name);
              } else {
                slog.debug(_templateObject9(), name, pos, newPos, v);
              }
            }
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }

        if (fails.length >= 1) {
          slog.debug(_templateObject7(), pos, fails);
        }
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    slog.info(_templateObject6(), self._hits(0), self._misses(0));
  }
});
var FIND = (0, _jessie.insulate)(function (template, pos) {
  var raw = template.raw;
  var numSubs = raw.length - 1;
  var relpos = pos;

  for (var segnum = 0; segnum <= numSubs; segnum++) {
    var segment = raw[segnum];
    var seglen = segment.length;

    if (relpos < seglen) {
      return [segnum, relpos];
    } else if (relpos === seglen && segnum < numSubs) {
      return segnum; // as hole number
    }

    relpos -= seglen + 1; // "+1" for the skipped hole
  }
});
var ACCEPT = (0, _jessie.insulate)(function (_self, pos) {
  // Not really needed: useful for incremental compilation.
  return [pos, []];
});
var EAT = (0, _jessie.insulate)(function (self, pos, str) {
  // if (self._debug) {
  //    slog.warn`Have ${self.template}`;
  // }
  var found = FIND(self.template, pos);

  if (Array.isArray(found)) {
    var segment = self.template.raw[found[0]];

    if (typeof str === 'string') {
      if (segment.startsWith(str, found[1])) {
        return [pos + str.length, str];
      }
    } else {
      // Just return the next character.
      return [pos + 1, segment[found[1]]];
    }
  }

  return [pos, FAIL];
});
var HOLE = (0, _jessie.insulate)(function (self, pos) {
  var found = FIND(self.template, pos);

  if (typeof found === 'number') {
    return [pos + 1, found];
  }

  return [pos, FAIL];
});
var FAIL = (0, _jessie.insulate)({
  toString: function toString() {
    return 'FAIL';
  }
});
var SKIP = (0, _jessie.insulate)({
  toString: function toString() {
    return 'SKIP';
  }
});
var lHexDigits = '0123456789abcdef';
var uHexDigits = 'ABCDEF';
var hexDigit = (0, _jessie.insulate)(function (c) {
  var i = lHexDigits.indexOf(c);

  if (i < 0) {
    i = uHexDigits.indexOf(c) + 10;
  }

  if (i < 0) {
    slog.error(_templateObject10(), {
      c: c
    });
  }

  return i;
});
var unescape = (0, _jessie.insulate)(function (cs) {
  if (cs[0] !== '\\') {
    return [cs[0], 1];
  } // It's an escape.


  var q = cs[1];

  switch (q) {
    case 'b':
      {
        q = '\b';
        break;
      }

    case 'f':
      {
        q = '\f';
        break;
      }

    case 'n':
      {
        q = '\n';
        break;
      }

    case 'r':
      {
        q = '\r';
        break;
      }

    case 't':
      {
        q = '\t';
        break;
      }

    case 'x':
      {
        var ord = hexDigit(cs[2]) * 16 + hexDigit(cs[3]);
        q = String.fromCharCode(ord);
        return [q, 4];
      }
  }

  return [q, 2];
});
var bootPeg = (0, _jessie.insulate)(function (makePeg, bootPegAst) {
  function compile(sexp) {
    var numSubs = 0; // # of holes implied by sexp, so far
    // generated names
    // act_${i}      action parameter
    // rule_${name}  method from peg rule
    // seq_${i}      sequence failure label
    // or_${i}       choice success label
    // pos_${i}      backtrack token index
    // s_${i}        accumulated list of values
    // v_${i}        set to s_${i} on fall thru path

    var alphaCount = 0;
    var vars = ['let value = FAIL'];

    function nextVar(prefix) {
      var result = "".concat(prefix, "_").concat(alphaCount++);
      vars.push(result);
      return result;
    }

    function takeVarsSrc() {
      var result = "".concat(vars.join(', '), ";");
      vars.length = 1;
      return result;
    }

    function nextLabel(prefix) {
      return "".concat(prefix, "_").concat(alphaCount++);
    }

    var vtable = {
      peg: function peg() {
        for (var _len = arguments.length, rules = new Array(_len), _key = 0; _key < _len; _key++) {
          rules[_key] = arguments[_key];
        }

        // The following line also initializes numSubs
        var rulesSrc = rules.map(peval).join('\n');
        var paramSrcs = [];

        for (var i = 0; i < numSubs; i++) {
          paramSrcs.push("act_".concat(i));
        } // rules[0] is the ast of the first rule, which has the form
        // ["def", ruleName, body], so rules[0][1] is the name of
        // the start rule. We prepend "rule_" to get the name of the
        // JS method that implements the start rule. We invoke it
        // with (0) so that it will parse starting at position 0. It
        // returns a pair of the final position (after the last
        // non-EOF token parsed), and the semantic value. On failure
        // to parse, the semantic value will be FAIL.


        var name = rules[0][1];
        return indent(_templateObject11(), paramSrcs.join(', '), name, JSON.stringify(name), rulesSrc);
      },
      def: function def(name, body) {
        var bodySrc = peval(body);
        return indent(_templateObject12(), name, takeVarsSrc(), bodySrc);
      },
      empty: function empty() {
        return "value = SKIP;";
      },
      fail: function fail() {
        return "value = FAIL;";
      },
      or: function or() {
        var labelSrc = nextLabel('or');

        for (var _len2 = arguments.length, choices = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          choices[_key2] = arguments[_key2];
        }

        var choicesSrc = choices.map(peval).map(function (cSrc) {
          return indent(_templateObject13(), cSrc, labelSrc);
        }).join('\n');
        return indent(_templateObject14(), labelSrc, choicesSrc);
      },
      seq: function seq() {
        var posSrc = nextVar('pos');
        var labelSrc = nextLabel('seq');
        var sSrc = nextVar('s');
        var vSrc = nextVar('v');

        for (var _len3 = arguments.length, terms = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          terms[_key3] = arguments[_key3];
        }

        var termsSrc = terms.map(peval).map(function (termSrc) {
          return indent(_templateObject15(), termSrc, labelSrc, sSrc);
        }).join('\n');
        return indent(_templateObject16(), sSrc, vSrc, posSrc, labelSrc, termsSrc, vSrc, vSrc, sSrc, vSrc, posSrc);
      },
      pred: function pred(hole) {
        numSubs = Math.max(numSubs, hole + 1);
        return "[pos, value] = act_".concat(hole, "(self, pos);");
      },
      val0: function val0() {
        // FIXME: Find a better way to specify where < foo > can
        // provide a default semantic action, and to warn
        // when it is in the wrong context.
        var termsSrc = vtable.seq.apply(vtable, arguments);
        return indent(_templateObject17(), termsSrc);
      },
      act: function act(hole) {
        var posSrc = nextVar('pos');
        numSubs = Math.max(numSubs, hole + 1);

        for (var _len4 = arguments.length, terms = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
          terms[_key4 - 1] = arguments[_key4];
        }

        var termsSrc = vtable.seq.apply(vtable, terms);
        return indent(_templateObject18(), posSrc, termsSrc, hole, posSrc);
      },
      '**': function _(patt, sep) {
        // for backtracking
        var posSrc = nextVar('pos'); // a non-advancing success only repeats once.

        var startSrc = nextVar('pos');
        var sSrc = nextVar('s');
        var pattSrc = peval(patt);
        var sepSrc = peval(sep);
        var sepValSrc = nextVar('sepVal'); // after first iteration, backtrack to before the separator

        return indent(_templateObject19(), sSrc, posSrc, sepValSrc, startSrc, pattSrc, posSrc, sepValSrc, sSrc, sepValSrc, sSrc, posSrc, sepSrc, sepValSrc, startSrc, sSrc);
      },
      '++': function _(patt, sep) {
        var starSrc = vtable['**'](patt, sep);
        return indent(_templateObject20(), starSrc);
      },
      '?': function _(patt) {
        return vtable['**'](patt, ['fail']);
      },
      '*': function _(patt) {
        return vtable['**'](patt, ['empty']);
      },
      '+': function _(patt) {
        return vtable['++'](patt, ['empty']);
      },
      super: function _super(ident) {
        return "[pos, value] = RUN(self, BaseParser.rule_".concat(ident, ", pos, ").concat(JSON.stringify("super.".concat(ident)), ");");
      },
      // PEG extensions.
      begin: function begin() {
        // Mark the current pos.
        return "beginPos = pos; value = [];";
      },
      end: function end() {
        // Use the specified beginPos to extract a string
        return indent(_templateObject21());
      },
      cls: function cls(cs) {
        // Character class.
        var classStr = '',
            i = 0;
        var invert = cs[i] === '^';

        if (invert) {
          ++i;
        }

        while (i < cs.length) {
          var _unescape = unescape(cs.slice(i)),
              _unescape2 = _slicedToArray(_unescape, 2),
              c = _unescape2[0],
              j = _unescape2[1];

          i += j;

          if (cs[i] === '-') {
            // It's a range.
            ++i;

            var _unescape3 = unescape(cs.slice(i)),
                _unescape4 = _slicedToArray(_unescape3, 2),
                c2 = _unescape4[0],
                j2 = _unescape4[1];

            i += j2;
            var min = c.charCodeAt(0);
            var max = c2.charCodeAt(0);

            for (var k = min; k <= max; k++) {
              classStr += String.fromCharCode(k);
            }
          } else {
            classStr += c;
          }
        }

        var op = invert ? '>=' : '<';
        var srcCs = JSON.stringify(classStr);
        return indent(_templateObject22(), srcCs, op);
      },
      dot: function dot() {
        return indent(_templateObject23());
      },
      lit: function lit(cs) {
        var str = '',
            i = 0;

        while (i < cs.length) {
          var _unescape5 = unescape(cs.slice(i)),
              _unescape6 = _slicedToArray(_unescape5, 2),
              c = _unescape6[0],
              j = _unescape6[1];

          i += j;
          str += c;
        }

        return indent(_templateObject24(), JSON.stringify(str));
      },
      peek: function peek(patt) {
        // for backtracking
        var posSrc = nextVar('pos');
        var pattSrc = peval(patt); // if the pattern matches, restore, else FAIL
        // always rewind.

        return indent(_templateObject25(), posSrc, pattSrc, posSrc);
      },
      peekNot: function peekNot(patt) {
        // for backtracking
        var posSrc = nextVar('pos');
        var pattSrc = peval(patt); // if the pattern matches, FAIL, else success,
        // always rewind.

        return indent(_templateObject26(), posSrc, pattSrc, posSrc);
      }
    };

    function peval(expr) {
      if (typeof expr === 'string') {
        // We only match idents... literal strings are protected
        // by ['lit', s].
        var nameStr = JSON.stringify(expr);
        return "[pos, value] = RUN(self, self.rule_".concat(expr, ", pos, ").concat(nameStr, ");");
      }

      var op = vtable[expr[0]];

      if (!op) {
        slog.error(_templateObject27(), expr[0]);
      }

      return op.apply(void 0, _toConsumableArray(expr.slice(1)));
    }

    return peval(sexp);
  }

  function quasiMemo(quasiCurry, parserCreator) {
    var wm = (0, _jessie.makeWeakMap)();
    var debug = false;

    var templateTag = function templateTag(templateOrFlag) {
      if (typeof templateOrFlag === 'string') {
        switch (templateOrFlag) {
          case 'DEBUG':
            {
              // Called as tag('DEBUG')`template string`
              // Turn on debug mode.
              debug = true;
              break;
            }

          default:
            {
              throw slog.error(_templateObject28(), {
                templateOrFlag: templateOrFlag
              });
            }
        }

        return templateTag;
      }

      var template = templateOrFlag;
      var quasiRest = wm.get(template);

      if (!quasiRest) {
        quasiRest = quasiCurry(template, debug);
        wm.set(template, quasiRest);
      }

      if (typeof quasiRest !== 'function') {
        slog.error(_templateObject29(), _typeof(quasiRest), quasiRest);
      }

      for (var _len5 = arguments.length, subs = new Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
        subs[_key5 - 1] = arguments[_key5];
      }

      return quasiRest.apply(void 0, subs);
    };

    templateTag.parserCreator = parserCreator;
    return templateTag;
  }

  function quasifyParser(parserCreator) {
    function baseCurry(template, debug) {
      var parser = parserCreator(template, debug);

      if (parser === undefined) {
        slog.error(_templateObject30());
      }

      var pair = null;

      try {
        pair = parser.start(parser);
      } finally {
        parser.done(parser); // hook for logging debug output
      }

      return pair;
    }

    return quasiMemo(baseCurry, parserCreator);
  }

  var defaultBaseGrammar = quasifyParser(function (_template) {
    return undefined;
  });

  function metaCompile(baseRules) {
    var baseAST = ['peg'].concat(_toConsumableArray(baseRules));
    var parserTraitMakerSrc = compile(baseAST); // slog.trace`SOURCES: ${parserTraitMakerSrc}\n`;

    var makeParserTrait = (0, _jessie.confineExpr)(parserTraitMakerSrc, {
      DONE: DONE,
      EAT: EAT,
      ERROR: ERROR,
      FAIL: FAIL,
      FIND: FIND,
      RUN: RUN,
      SKIP: SKIP,
      makeMap: _jessie.makeMap,
      makeTokStr: makeTokStr
    });
    return function parserTag() {
      var parserTrait = makeParserTrait.apply(void 0, arguments);

      var _asExtending2;

      var quasiParser;

      var ext = function ext(baseQuasiParser) {
        function tag0(templateOrFlag) {
          var flags = [];

          function tag(tmplOrFlag) {
            if (typeof tmplOrFlag === 'string') {
              flags.push(tmplOrFlag);
              return tag;
            }

            for (var _len7 = arguments.length, subs = new Array(_len7 > 1 ? _len7 - 1 : 0), _key7 = 1; _key7 < _len7; _key7++) {
              subs[_key7 - 1] = arguments[_key7];
            }

            var boundParser = quasiParser.apply(void 0, [tmplOrFlag].concat(subs));

            var parserBase = boundParser._asExtending(baseQuasiParser);

            var parser = flags.reduce(function (p, flag) {
              return p(flag);
            }, parserBase);
            return parser;
          }

          tag.ACCEPT = ACCEPT;
          tag.EAT = EAT;
          tag.FAIL = FAIL;
          tag.HOLE = HOLE;
          tag.SKIP = SKIP;
          tag._asExtending = _asExtending2;
          tag.extends = ext;
          tag.parserCreator = quasiParser.parserCreator;

          if (typeof templateOrFlag === 'string') {
            return tag(templateOrFlag);
          }

          for (var _len6 = arguments.length, substs = new Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
            substs[_key6 - 1] = arguments[_key6];
          }

          return tag.apply(void 0, [templateOrFlag].concat(substs));
        }

        tag0.ACCEPT = ACCEPT;
        tag0.EAT = EAT;
        tag0.FAIL = FAIL;
        tag0.HOLE = HOLE;
        tag0.SKIP = SKIP;
        tag0._asExtending = _asExtending2;
        tag0.extends = ext;
        tag0.parserCreator = quasiParser.parserCreator;
        return tag0;
      };

      _asExtending2 = function _asExtending(baseQuasiParser) {
        var parserCreator = parserTrait(baseQuasiParser.parserCreator);
        var parser = quasifyParser(parserCreator);
        var pegTag = parser;
        pegTag.ACCEPT = ACCEPT;
        pegTag.EAT = EAT;
        pegTag.FAIL = FAIL;
        pegTag.HOLE = HOLE;
        pegTag.SKIP = SKIP;
        pegTag._asExtending = _asExtending2;
        pegTag.extends = ext;
        return pegTag;
      };

      defaultBaseGrammar._asExtending = _asExtending2;
      var closedDefaultBaseGrammar = defaultBaseGrammar;
      closedDefaultBaseGrammar._asExtending = _asExtending2;
      quasiParser = _asExtending2(closedDefaultBaseGrammar);
      return quasiParser;
    };
  } // Bootstrap the compiler with the precompiled pegAst.


  var actionExtractorTag = function actionExtractorTag(_template) {
    for (var _len8 = arguments.length, actions = new Array(_len8 > 1 ? _len8 - 1 : 0), _key8 = 1; _key8 < _len8; _key8++) {
      actions[_key8 - 1] = arguments[_key8];
    }

    return actions;
  };

  actionExtractorTag.ACCEPT = ACCEPT;
  actionExtractorTag.HOLE = HOLE;
  actionExtractorTag.SKIP = SKIP; // Extract the actions, binding them to the metaCompile function.

  var bootPegActions = makePeg(actionExtractorTag, metaCompile); // Create the parser tag from the AST and the actions.

  var compiledAst = metaCompile(bootPegAst);
  var bootPegTag = compiledAst.apply(void 0, _toConsumableArray(bootPegActions)); // Use the parser tag to create another parser tag that returns the AST.

  var astExtractorTag = makePeg(bootPegTag, function (defs) {
    return function () {
      return defs;
    };
  });
  var reparsedPegAst = makePeg(astExtractorTag, undefined); // Compare our bootPegTag output to bootPegAst, to help ensure it is
  // correct.  This doesn't defend against a malicious bootPeg,
  // but it does prevent silly mistakes.

  var a = JSON.stringify(bootPegAst, undefined, '  ');
  var b = JSON.stringify(reparsedPegAst, undefined, '  ');

  if (a !== b) {
    slog.info(_templateObject31(), {
      b: b
    });
    slog.panic(_templateObject32());
  } // Use the metaCompiler to generate another parser.


  var finalPegTag = makePeg(bootPegTag, metaCompile);
  return finalPegTag;
});
var _default = bootPeg;
exports.default = _default;
},{"@agoric/jessie":"YilW","@michaelfig/slog":"Ipmo","./indent.mjs":"cE9W"}],"joiS":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _jessie = require("@agoric/jessie");

// boot-pegast.mjs.ts - AUTOMATICALLY GENERATED by boot-env.mjs.ts
var _default = (0, _jessie.insulate)([["def", "Grammar", ["act", 0, "_Spacing", ["+", "Definition"], "_EndOfFile"]], ["def", "Definition", ["act", 2, "Identifier", "LEFTARROW", "Expression", "SEMI", ["pred", 1]]], ["def", "Expression", ["act", 3, ["**", "Sequence", "_SLASH"]]], ["def", "Sequence", ["act", 5, ["act", 4, ["*", "Prefix"]], ["?", "HOLE"]]], ["def", "Prefix", ["or", ["act", 6, "AND", "HOLE"], ["act", 7, "AND", "Suffix"], ["act", 8, "NOT", "Suffix"], ["val0", "Suffix"]]], ["def", "Suffix", ["or", ["act", 9, "Primary", ["or", ["val0", "STARSTAR"], ["val0", "PLUSPLUS"]], "Primary"], ["act", 10, "Primary", ["or", ["val0", "QUESTION"], ["val0", "STAR"], ["val0", "PLUS"]]], ["val0", "Primary"]]], ["def", "Primary", ["or", ["val0", "Super"], ["val0", "Identifier", ["peekNot", "LEFTARROW"]], ["act", 11, "OPEN", "Expression", "CLOSE"], ["act", 12, "Literal"], ["act", 13, "Class"], ["act", 14, "DOT"], ["act", 15, "BEGIN"], ["act", 16, "END"]]], ["def", "Super", ["act", 17, ["lit", "super."], "Identifier"]], ["def", "Identifier", ["val0", ["begin"], "IdentStart", ["*", "IdentCont"], ["end"], "_Spacing"]], ["def", "IdentStart", ["val0", ["cls", "a-zA-Z_"]]], ["def", "IdentCont", ["or", ["val0", "IdentStart"], ["val0", ["cls", "0-9"]]]], ["def", "Literal", ["or", ["val0", ["cls", "'"], ["begin"], ["*", ["val0", ["peekNot", ["cls", "'"]], "Char"]], ["end"], ["cls", "'"], "_Spacing"], ["val0", ["cls", "\""], ["begin"], ["*", ["val0", ["peekNot", ["cls", "\""]], "Char"]], ["end"], ["cls", "\""], "_Spacing"]]], ["def", "Class", ["val0", ["lit", "["], ["begin"], ["*", ["val0", ["peekNot", ["lit", "]"]], "Range"]], ["end"], ["lit", "]"], "_Spacing"]], ["def", "Range", ["or", ["val0", "Char", ["lit", "-"], "Char"], ["val0", "Char"]]], ["def", "Char", ["or", ["val0", ["lit", "\\\\"], ["cls", "abefnrtv'\"\\[\\]\\\\\\`\\$"]], ["val0", ["lit", "\\\\x"], ["cls", "0-9a-fA-F"], ["cls", "0-9a-fA-F"]], ["val0", ["lit", "\\\\"], ["lit", "-"]], ["val0", ["peekNot", ["lit", "\\\\"]], ["dot"]]]], ["def", "LEFTARROW", ["val0", ["lit", "<-"], "_Spacing"]], ["def", "_SLASH", ["act", 18, ["lit", "/"], "_Spacing"]], ["def", "SEMI", ["val0", ["lit", ";"], "_Spacing"]], ["def", "AND", ["val0", ["lit", "&"], "_Spacing"]], ["def", "NOT", ["val0", ["lit", "~"], "_Spacing"]], ["def", "QUESTION", ["val0", ["lit", "?"], "_Spacing"]], ["def", "STAR", ["val0", ["lit", "*"], "_Spacing"]], ["def", "PLUS", ["val0", ["lit", "+"], "_Spacing"]], ["def", "OPEN", ["val0", ["lit", "("], "_Spacing"]], ["def", "CLOSE", ["val0", ["lit", ")"], "_Spacing"]], ["def", "DOT", ["val0", ["lit", "."], "_Spacing"]], ["def", "_Spacing", ["act", 19, ["*", ["or", ["val0", "Space"], ["val0", "Comment"]]]]], ["def", "Comment", ["val0", ["lit", "#"], ["*", ["val0", ["peekNot", "EndOfLine"], ["dot"]]], "EndOfLine"]], ["def", "Space", ["or", ["val0", ["lit", " "]], ["val0", ["lit", "\\t"]], ["val0", "EndOfLine"]]], ["def", "EndOfLine", ["or", ["val0", ["lit", "\\r\\n"]], ["val0", ["lit", "\\n"]], ["val0", ["lit", "\\r"]]]], ["def", "_EndOfFile", ["val0", ["peekNot", ["dot"]]]], ["def", "HOLE", ["val0", ["pred", 20], "_Spacing"]], ["def", "BEGIN", ["val0", ["lit", "<"], "_Spacing"]], ["def", "END", ["val0", ["lit", ">"], "_Spacing"]], ["def", "PLUSPLUS", ["val0", ["lit", "++"], "_Spacing"]], ["def", "STARSTAR", ["val0", ["lit", "**"], "_Spacing"]]]);

exports.default = _default;
},{"@agoric/jessie":"YilW"}],"3zTw":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _jessie = require("@agoric/jessie");

function _templateObject() {
  var data = _taggedTemplateLiteral(["\n# Hierarchical syntax\n\nGrammar      <- _Spacing Definition+ _EndOfFile\n                    ", ";\n\nDefinition   <- Identifier LEFTARROW Expression SEMI &", "\n                    ", ";\nExpression   <- Sequence ** _SLASH\n                    ", ";\nSequence     <- (Prefix*\n                    ", ")\n                 HOLE?\n                    ", ";\nPrefix       <- AND HOLE\n                    ", "\n              / AND Suffix\n                    ", "\n              / NOT Suffix\n                    ", "\n              /     Suffix;\nSuffix       <- Primary (STARSTAR\n                        / PLUSPLUS) Primary\n                    ", "\n              / Primary (QUESTION\n                        / STAR\n                        / PLUS)\n                    ", "\n              / Primary;\nPrimary      <- Super\n              / Identifier ~LEFTARROW\n              / OPEN Expression CLOSE\n                    ", "\n              / Literal\n                    ", "\n              / Class\n                    ", "\n              / DOT\n                    ", "\n              / BEGIN\n                    ", "\n              / END\n                    ", "\n              ;\n\nSuper        <- 'super.' Identifier\n                    ", ";\n\n# Lexical syntax\n\nIdentifier   <- < IdentStart IdentCont* > _Spacing;\nIdentStart   <- [a-zA-Z_];\nIdentCont    <- IdentStart / [0-9];\nLiteral      <- ['] < (~['] Char )* > ['] _Spacing\n              / [\"] < (~[\"] Char )* > [\"] _Spacing;\nClass        <- '[' < (~']' Range)* > ']' _Spacing;\nRange        <- Char '-' Char / Char;\nChar         <- '\\' [abefnrtv'\"[]\\`$]\n              / '\\x' [0-9a-fA-F][0-9a-fA-F]\n              / '\\' '-'\n              / ~'\\' .;\nLEFTARROW    <- '<-' _Spacing;\n_SLASH        <- '/' _Spacing              ", ";\nSEMI         <- ';' _Spacing;\nAND          <- '&' _Spacing;\nNOT          <- '~' _Spacing;\nQUESTION     <- '?' _Spacing;\nSTAR         <- '*' _Spacing;\nPLUS         <- '+' _Spacing;\nOPEN         <- '(' _Spacing;\nCLOSE        <- ')' _Spacing;\nDOT          <- '.' _Spacing;\n_Spacing      <- (Space / Comment)*        ", ";\nComment      <- '#' (~EndOfLine .)* EndOfLine;\nSpace        <- ' ' / '\t' / EndOfLine;\nEndOfLine    <- '\r\n' / '\n' / '\r';\n_EndOfFile    <- ~.;\n\nHOLE         <- &", " _Spacing;\nBEGIN        <- '<' _Spacing;\nEND          <- '>' _Spacing;\nPLUSPLUS     <- '++' _Spacing;\nSTARSTAR     <- '**' _Spacing;\n"], ["\n# Hierarchical syntax\n\nGrammar      <- _Spacing Definition+ _EndOfFile\n                    ", ";\n\nDefinition   <- Identifier LEFTARROW Expression SEMI &", "\n                    ", ";\nExpression   <- Sequence ** _SLASH\n                    ", ";\nSequence     <- (Prefix*\n                    ", ")\n                 HOLE?\n                    ", ";\nPrefix       <- AND HOLE\n                    ", "\n              / AND Suffix\n                    ", "\n              / NOT Suffix\n                    ", "\n              /     Suffix;\nSuffix       <- Primary (STARSTAR\n                        / PLUSPLUS) Primary\n                    ", "\n              / Primary (QUESTION\n                        / STAR\n                        / PLUS)\n                    ", "\n              / Primary;\nPrimary      <- Super\n              / Identifier ~LEFTARROW\n              / OPEN Expression CLOSE\n                    ", "\n              / Literal\n                    ", "\n              / Class\n                    ", "\n              / DOT\n                    ", "\n              / BEGIN\n                    ", "\n              / END\n                    ", "\n              ;\n\nSuper        <- 'super.' Identifier\n                    ", ";\n\n# Lexical syntax\n\nIdentifier   <- < IdentStart IdentCont* > _Spacing;\nIdentStart   <- [a-zA-Z_];\nIdentCont    <- IdentStart / [0-9];\nLiteral      <- ['] < (~['] Char )* > ['] _Spacing\n              / [\"] < (~[\"] Char )* > [\"] _Spacing;\nClass        <- '[' < (~']' Range)* > ']' _Spacing;\nRange        <- Char '-' Char / Char;\nChar         <- '\\\\' [abefnrtv'\"\\[\\]\\\\\\`\\$]\n              / '\\\\x' [0-9a-fA-F][0-9a-fA-F]\n              / '\\\\' '-'\n              / ~'\\\\' .;\nLEFTARROW    <- '<-' _Spacing;\n_SLASH        <- '/' _Spacing              ", ";\nSEMI         <- ';' _Spacing;\nAND          <- '&' _Spacing;\nNOT          <- '~' _Spacing;\nQUESTION     <- '?' _Spacing;\nSTAR         <- '*' _Spacing;\nPLUS         <- '+' _Spacing;\nOPEN         <- '(' _Spacing;\nCLOSE        <- ')' _Spacing;\nDOT          <- '.' _Spacing;\n_Spacing      <- (Space / Comment)*        ", ";\nComment      <- '#' (~EndOfLine .)* EndOfLine;\nSpace        <- ' ' / '\\t' / EndOfLine;\nEndOfLine    <- '\\r\\n' / '\\n' / '\\r';\n_EndOfFile    <- ~.;\n\nHOLE         <- &", " _Spacing;\nBEGIN        <- '<' _Spacing;\nEND          <- '>' _Spacing;\nPLUSPLUS     <- '++' _Spacing;\nSTARSTAR     <- '**' _Spacing;\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

// PEG quasi Grammar for PEG quasi Grammars
// Michael FIG <michael+jessica@fig.org>, 2019-01-05
//
// This grammar is adapted from:
// http://piumarta.com/software/peg/peg-0.1.18/src/peg.peg
//
// Modified for Jessica to support:
//   Semantic actions provided in tagged template HOLEs
//   '~' for negative lookahead (instead of '!')
//   ';' terminator for definitions
//   '**' and '++' for separators
//   'super.RULE' syntax for extended grammars
//   '\xFF' instead of octal character literals
// which are adapted from:
// https://github.com/erights/quasiParserGenerator
/// <reference path="peg.d.ts"/>
var makePeg = (0, _jessie.insulate)(function (pegTag, metaCompile) {
  var ACCEPT = pegTag.ACCEPT,
      HOLE = pegTag.HOLE,
      SKIP = pegTag.SKIP;

  function simple(prefix, list) {
    if (list.length === 0) {
      return ['empty'];
    }

    if (list.length === 1) {
      return list[0];
    }

    return [prefix].concat(_toConsumableArray(list));
  }

  function flatArgs(args) {
    return args.reduce(function (prior, a) {
      prior.push.apply(prior, _toConsumableArray(flatSeq(a)));
      return prior;
    }, []);
  }

  function flatSeq(term) {
    if (Array.isArray(term)) {
      if (term.length === 0) {
        return [];
      }

      var _term = _toArray(term),
          kind = _term[0],
          terms = _term.slice(1);

      if (kind === 'seq') {
        return flatArgs(terms);
      } else if (terms.length === 0 && Array.isArray(kind)) {
        return flatSeq(kind);
      } else {
        return [[kind].concat(_toConsumableArray(flatArgs(terms)))];
      }
    }

    return [term];
  }

  return pegTag(_templateObject(), metaCompile, ACCEPT, function (i, _, e, _2) {
    return ['def', i, e];
  }, function (list) {
    return simple('or', list);
  }, function (list) {
    return simple('seq', list);
  }, function (seq, optHole) {
    return optHole.length === 0 ? ['val0'].concat(_toConsumableArray(flatSeq(seq))) : ['act', optHole[0]].concat(_toConsumableArray(flatSeq(seq)));
  }, function (_, a) {
    return ['pred', a];
  }, function (_, s) {
    return ['peek', s];
  }, function (_, s) {
    return ['peekNot', s];
  }, function (patt, q, sep) {
    return [q, patt, sep];
  }, function (patt, optQ) {
    return [optQ[0], patt];
  }, function (_, e, _2) {
    return e;
  }, function (s) {
    return ['lit', s];
  }, function (c) {
    return ['cls', c];
  }, function () {
    return ['dot'];
  }, function () {
    return ['begin'];
  }, function () {
    return ['end'];
  }, function (_, i) {
    return ['super', i];
  }, function (_) {
    return SKIP;
  }, function (_) {
    return SKIP;
  }, HOLE);
});
var _default = makePeg;
exports.default = _default;
},{"@agoric/jessie":"YilW"}],"xkRL":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _jessie = require("@agoric/jessie");

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _templateObject() {
  var data = _taggedTemplateLiteral(["\n    # Override rather than inherit start production.\n    # Only module syntax is permitted.\n    start <- _WS moduleBody _EOF               ", ";\n\n    # A.5 Scripts and Modules\n\n    insulatedExpr <- < super.insulatedExpr >;\n\n    moduleBody <- moduleItem*;\n    moduleItem <-\n      < SEMI >\n    / importDecl    # Same AST as in Jessie.\n    / exportDecl    # Similar AST, but insulatedExpr is source string.\n    / < moduleDeclaration >;  # Source string.\n\n    exportDecl <-\n      EXPORT DEFAULT < exportableExpr > SEMI    ", "\n    / EXPORT moduleDeclaration                  ", ";\n    "]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

// An extension of the Jessie grammar to facilitate rewriting
// imports/exports as AMD.
/// <reference path="peg.d.ts"/>
var makeJessieModule = (0, _jessie.insulate)(function (jessiePeg) {
  return jessiePeg(_templateObject(), function (b) {
    return function () {
      return ['moduleX', b];
    };
  }, function (e) {
    return ['exportDefaultX', e];
  }, function (_, d) {
    return ['exportX'].concat(_toConsumableArray(d));
  });
});
var _default = makeJessieModule;
exports.default = _default;
},{"@agoric/jessie":"YilW"}],"NMVp":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _jessie = require("@agoric/jessie");

function _templateObject2() {
  var data = _taggedTemplateLiteral(["\n    # Jump to the expr production.\n    start <- _WS expr _EOF              ", ";\n    "]);

  _templateObject2 = function _templateObject2() {
    return data;
  };

  return data;
}

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _templateObject() {
  var data = _taggedTemplateLiteral(["\n    # Override rather than inherit start production.\n    # Only module syntax is permitted.\n    start <- _WS moduleBody _EOF               ", ";\n\n    # A.1 Lexical Grammar\n\n    # For proposed eventual send expressions\n    LATER <- _NO_NEWLINE \"!\" _WS;\n\n    # A.2 Expressions\n\n    # Jessie primaryExpr does not include \"this\", ClassExpression,\n    # GeneratorExpression, AsyncFunctionExpression,\n    # AsyncGenerarorExpression, or RegularExpressionLiteral.\n    primaryExpr <-\n      super.primaryExpr\n    / functionExpr;\n\n    propDef <-\n      methodDef\n    / super.propDef;\n\n    purePropDef <-\n      methodDef\n    / super.purePropDef;\n\n    # Recognize pre-increment/decrement.\n    prePre <-\n      (PLUSPLUS / MINUSMINUS)                          ", "\n    / super.prePre;\n\n    # Extend to recognize proposed eventual get syntax,\n    # as well as computed indices and postfix increment/decrement.\n    memberPostOp <-\n      super.memberPostOp\n    / LEFT_BRACKET assignExpr RIGHT_BRACKET        ", "\n    / LATER LEFT_BRACKET assignExpr RIGHT_BRACKET  ", "\n    / LATER IDENT_NAME                             ", ";\n\n    # Extend to recognize proposed eventual send syntax.\n    # We distinguish b!foo(x) from calling b!foo by a post-parsing pass\n    callPostOp <-\n      super.callPostOp\n    / LATER args                                           ", ";\n\n    postOp <- (PLUSPLUS / MINUSMINUS) _WS;\n\n    # to be extended\n    assignExpr <-\n      arrowFunc\n    / functionExpr\n    / lValue postOp                                        ", "\n    / lValue (EQUALS / assignOp) assignExpr                ", "\n    / super.assignExpr\n    / primaryExpr;\n\n    # An expression without side-effects.\n    pureExpr <-\n      arrowFunc\n    / super.pureExpr;\n\n    # In Jessie, an lValue is only a variable, a computed index-named\n    # property (an array element), or a statically string-named\n    # property.\n    # We allow assignment to statically string-named fields, since it\n    # is useful during initialization and prevented thereafter by\n    # mandatory tamper-proofing.\n\n    # to be overridden or extended\n    lValue <-\n      primaryExpr LEFT_BRACKET indexExpr RIGHT_BRACKET     ", "\n    / primaryExpr LATER LEFT_BRACKET indexExpr RIGHT_BRACKET ", "\n    / primaryExpr DOT IDENT_NAME                           ", "\n    / primaryExpr LATER IDENT_NAME                         ", "\n    / useVar;\n\n    assignOp <-\n      (\"*=\" / \"/=\" / \"%=\" / \"+=\" / \"-=\"\n    / \"<<=\" / \">>=\" / \">>>=\"\n    / \"&=\" / \"^=\" / \"|=\"\n    / \"**=\") _WS;\n\n\n    # A.3 Statements\n\n    # to be extended.\n    # The exprStatement production must go last, so PEG's prioritized\n    # choice will interpret {} as a block rather than an expression.\n    statement <-\n      block\n    / IF LEFT_PAREN expr RIGHT_PAREN arm ELSE elseArm      ", "\n    / IF LEFT_PAREN expr RIGHT_PAREN arm                   ", "\n    / breakableStatement\n    / terminator\n    / IDENT COLON statement                                ", "\n    / TRY block catcher finalizer                          ", "\n    / TRY block catcher                                    ", "\n    / TRY block finalizer                                  ", "\n    / DEBUGGER SEMI                                        ", "\n    / exprStatement;\n\n    # to be overridden.  In Jessie, only blocks are accepted as arms\n    # of flow-of-control statements.\n    arm <- block;\n\n    # Allows for\n    # if (...) {} else if (...) {} else if (...) {};\n    elseArm <-\n      arm\n    / IF LEFT_PAREN expr RIGHT_PAREN arm ELSE elseArm      ", "\n    / IF LEFT_PAREN expr RIGHT_PAREN arm                   ", ";\n\n    breakableStatement <-\n      FOR LEFT_PAREN declOp forOfBinding OF expr RIGHT_PAREN arm\n            ", "\n    / FOR LEFT_PAREN declaration expr? SEMI expr? RIGHT_PAREN arm ", "\n    / WHILE LEFT_PAREN expr RIGHT_PAREN arm                       ", "\n    / SWITCH LEFT_PAREN expr RIGHT_PAREN LEFT_BRACE clause* RIGHT_BRACE\n            ", ";\n\n    # Each case clause must end in a terminating statement.\n    terminator <-\n      \"continue\" _NO_NEWLINE IDENT SEMI                ", "\n    / \"continue\" _WS SEMI                              ", "\n    / \"break\" _NO_NEWLINE IDENT SEMI                   ", "\n    / \"break\" _WS SEMI                                 ", "\n    / \"return\" _NO_NEWLINE expr SEMI                   ", "\n    / \"return\" _WS SEMI                                ", "\n    / \"throw\" _NO_NEWLINE expr SEMI                    ", ";\n\n    block <- LEFT_BRACE body RIGHT_BRACE              ", ";\n    body <- statementItem*;\n\n    # declaration must come first, so that PEG will prioritize\n    # function declarations over exprStatement.\n    statementItem <-\n      declaration\n    / statement;\n\n    # No \"class\" declaration.\n    # No generator, async, or async iterator function.\n    declaration <-\n      declOp binding ** _COMMA SEMI                    ", "\n    / functionDecl;\n\n    declOp <- (\"const\" / \"let\") _WSN;\n\n    forOfBinding <- bindingPattern / defVar;\n    binding <-\n      bindingPattern EQUALS assignExpr                ", "\n    / defVar EQUALS assignExpr                        ", "\n    / defVar;\n\n    bindingPattern <-\n      LEFT_BRACKET elementParam ** _COMMA RIGHT_BRACKET     ", "\n    / LEFT_BRACE propParam ** _COMMA RIGHT_BRACE            ", ";\n\n    pattern <-\n      bindingPattern\n    / defVar\n    / dataLiteral                                     ", "\n    / HOLE                                            ", ";\n\n    # to be overridden\n    elementParam <- param;\n\n    param <-\n      ELLIPSIS pattern                                ", "\n    / defVar EQUALS assignExpr                        ", "\n    / pattern;\n\n    propParam <-\n      ELLIPSIS pattern                                ", "\n    / propName COLON pattern                          ", "\n    / defVar EQUALS assignExpr                        ", "\n    / defVar                                          ", ";\n\n    # Use PEG prioritized choice.\n    # TODO emit diagnostic for failure cases.\n    exprStatement <-\n      ~cantStartExprStatement expr SEMI               ", ";\n\n    cantStartExprStatement <-\n      (\"{\" / \"function\" / \"async\" _NO_NEWLINE \"function\"\n    / \"class\" / \"let\" / \"[\") _WSN;\n\n    # to be overridden\n    terminatedBody <- ((~terminator statementItem)* terminator)+   ", ";\n    clause <-\n      caseLabel+ LEFT_BRACE terminatedBody RIGHT_BRACE ", ";\n    caseLabel <-\n      CASE expr COLON                                 ", "\n    / DEFAULT _WS COLON                                ", ";\n\n    catcher <- CATCH LEFT_PAREN pattern RIGHT_PAREN block ", ";\n    finalizer <- FINALLY block                        ", ";\n\n\n    # A.4 Functions and Classes\n\n    functionDecl <-\n      FUNCTION defVar LEFT_PAREN param ** _COMMA RIGHT_PAREN block\n                                                      ", ";\n\n    functionExpr <-\n      FUNCTION defVar? LEFT_PAREN param ** _COMMA RIGHT_PAREN block\n                                                      ", ";\n\n    # The assignExpr form must come after the block form, to make proper use\n    # of PEG prioritized choice.\n    arrowFunc <-\n      arrowParams _NO_NEWLINE ARROW block              ", "\n    / arrowParams _NO_NEWLINE ARROW assignExpr         ", ";\n\n    arrowParams <-\n      IDENT                                           ", "\n    / LEFT_PAREN param ** _COMMA RIGHT_PAREN           ", ";\n\n    # to be extended\n    methodDef <-\n      method\n    / GET propName LEFT_PAREN RIGHT_PAREN block            ", "\n    / SET propName LEFT_PAREN param RIGHT_PAREN block      ", ";\n\n    method <-\n      propName LEFT_PAREN param ** _COMMA RIGHT_PAREN block ", ";\n\n\n    # A.5 Scripts and Modules\n\n    moduleBody <- moduleItem*;\n    moduleItem <-\n      SEMI                                               ", "\n    / importDecl\n    / exportDecl\n    / moduleDeclaration;\n\n    useImport <- IMPORT_PFX IDENT                 ", ";\n    defImport <- IMPORT_PFX IDENT                 ", ";\n\n    moduleDeclaration <-\n      \"const\" _WSN moduleBinding ** _COMMA SEMI       ", ";\n\n    # An insulated expression without side-effects.\n    insulatedExpr <-\n      dataLiteral                                     ", "\n    / \"insulate\" _WS LEFT_PAREN (pureExpr / useImport) RIGHT_PAREN  ", "\n    / useVar;\n\n    # Jessie modules only allow insulated module-level bindings.\n    moduleBinding <-\n      bindingPattern EQUALS insulatedExpr       ", "\n    / defVar EQUALS insulatedExpr               ", "\n    / defVar;\n\n    importClause <-\n      STAR AS defImport                         ", "\n    / namedImports                              ", "\n    / defImport _COMMA STAR AS defImport        ", "\n    / defImport _COMMA namedImports             ", "\n    / defImport                                 ", ";\n\n    safeImportClause <-\n      safeNamedImports                          ", ";\n\n    importSpecifier <-\n      defImport                                 ", "\n    / IDENT_NAME AS defImport                   ", ";\n\n    # No renaming of safe imports.\n    safeImportSpecifier <-\n      defVar                               ", "\n    / \"insulate\" _WSN                      ", ";\n\n    namedImports <-\n      LEFT_BRACE importSpecifier ** _COMMA _COMMA? RIGHT_BRACE ", ";\n\n    safeNamedImports <-\n      LEFT_BRACE safeImportSpecifier ** _COMMA _COMMA? RIGHT_BRACE ", ";\n\n    safeModule <-\n      STRING ", ";\n\n    importDecl <-\n      IMPORT importClause FROM STRING SEMI  ", "\n    / IMPORT safeImportClause FROM safeModule SEMI   ", ";\n\n    exportDecl <-\n      EXPORT DEFAULT exportableExpr SEMI        ", "\n    / EXPORT moduleDeclaration                  ", ";\n\n    # to be extended\n    exportableExpr <- insulatedExpr;\n\n    # Lexical syntax\n    ARROW <- \"=>\" _WS;\n    AS <- \"as\" _WSN;\n    DEBUGGER <- \"debugger\" _WSN;\n    PLUSPLUS <- \"++\" _WSN;\n    MINUSMINUS <- \"--\" _WSN;\n    CASE <- \"case\" _WSN;\n    IF <- \"if\" _WSN;\n    ELSE <- \"else\" _WSN;\n    FOR <- \"for\" _WSN;\n    OF <- \"of\" _WSN;\n    WHILE <- \"while\" _WSN;\n    BREAK <- \"break\" _WSN;\n    CONTINUE <- \"continue\" _WSN;\n    SWITCH <- \"switch\" _WSN;\n    TRY <- \"try\" _WSN;\n    CATCH <- \"catch\" _WSN;\n    FINALLY <- \"finally\" _WSN;\n    GET <- \"get\" _WSN;\n    SET <- \"set\" _WSN;\n    IMPORT <- \"import\" _WSN;\n    EXPORT <- \"export\" _WSN;\n    FROM <- \"from\" _WSN;\n    FUNCTION <- \"function\" _WSN;\n    DEFAULT <- \"default\" _WSN;\n    EQUALS <- \"=\" _WS;\n    SEMI <- \";\" _WS;\n    STAR <- \"*\" _WS;\n    "]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

// Subsets of JavaScript, starting from the grammar as defined at
// http://www.ecma-international.org/ecma-262/9.0/#sec-grammar-summary
// See https://github.com/Agoric/Jessie/blob/master/README.md
// for documentation of the Jessie grammar defined here.
/// <reference path="peg.d.ts"/>
// Safe Modules are ones that can be imported without
// insulating their symbols.
var isSafeModule = (0, _jessie.insulate)(function (moduleName) {
  switch (moduleName) {
    case '@agoric/jessie':
      {
        return true;
      }

    default:
      {
        return false;
      }
  }
});
var terminatedBlock = (0, _jessie.insulate)(function (manyBodies) {
  var stmts = manyBodies.reduce(function (prior, body) {
    var _body = _slicedToArray(body, 2),
        bs = _body[0],
        t = _body[1];

    bs.forEach(function (b) {
      return prior.push(b);
    });
    prior.push(t);
    return prior;
  }, []);
  return ['block', stmts];
});
var makeJessie = (0, _jessie.insulate)(function (peg, justinPeg) {
  var FAIL = justinPeg.FAIL,
      SKIP = justinPeg.SKIP;
  var jessieTag = justinPeg(_templateObject(), function (b) {
    return function () {
      return ['module', b];
    };
  }, function (op) {
    return "pre:".concat(op);
  }, function (_, e, _2) {
    return ['index', e];
  }, function (_, _2, e, _3) {
    return ['indexLater', e];
  }, function (_, id) {
    return ['getLater', id];
  }, function (_, args) {
    return ['callLater', args];
  }, function (lv, op) {
    return [op, lv];
  }, function (lv, op, rv) {
    return [op, lv, rv];
  }, function (pe, _, e, _2) {
    return ['index', pe, e];
  }, function (pe, _, _2, e, _3) {
    return ['indexLater', pe, e];
  }, function (pe, _, id) {
    return ['get', pe, id];
  }, function (pe, _, id) {
    return ['getLater', pe, id];
  }, function (_, _2, c, _3, t, _4, e) {
    return ['if', c, t, e];
  }, function (_, _2, c, _3, t) {
    return ['if', c, t];
  }, function (label, _, stat) {
    return ['label', label, stat];
  }, function (_, b, c, f) {
    return ['try', b, c, f];
  }, function (_, b, c) {
    return ['try', b, c];
  }, function (_, b, f) {
    return ['try', b, undefined, f];
  }, function (_, _2) {
    return ['debugger'];
  }, function (_, _2, c, _3, t, _4, e) {
    return ['if', c, t, e];
  }, function (_, _2, c, _3, t) {
    return ['if', c, t];
  }, function (_, _2, o, d, _3, e, _4, b) {
    return ['forOf', o, d, e, b];
  }, function (_, _2, d, c, _3, i, _4, b) {
    return ['for', d, c, i, b];
  }, function (_, _2, c, _3, b) {
    return ['while', c, b];
  }, function (_, _2, e, _3, _4, bs, _5) {
    return ['switch', e, bs];
  }, function (_, label, _3) {
    return ['continue', label];
  }, function (_, _2) {
    return ['continue'];
  }, function (_, label, _2) {
    return ['break', label];
  }, function (_, _2) {
    return ['break'];
  }, function (_, e, _2) {
    return ['return', e];
  }, function (_, _2) {
    return ['return'];
  }, function (_, e, _3) {
    return ['throw', e];
  }, function (_, b, _2) {
    return ['block', b];
  }, function (op, decls, _) {
    return [op, decls];
  }, function (p, _, e) {
    return ['bind', p, e];
  }, function (p, _, e) {
    return ['bind', p, e];
  }, function (_, ps, _2) {
    return ['matchArray', ps];
  }, function (_, ps, _2) {
    return ['matchRecord', ps];
  }, function (n) {
    return ['matchData', JSON.parse(n)];
  }, function (h) {
    return ['patternHole', h];
  }, function (_, p) {
    return ['rest', p];
  }, function (v, _, e) {
    return ['optional', v, e];
  }, function (_, p) {
    return ['restObj', p];
  }, function (k, _, p) {
    return ['matchProp', k, p];
  }, function (id, _, e) {
    return ['optionalProp', id[1], id, e];
  }, function (id) {
    return ['matchProp', id[1], id];
  }, function (e, _2) {
    return e;
  }, function (tb) {
    return terminatedBlock(tb);
  }, function (cs, _, b, _2) {
    return ['clause', cs, b];
  }, function (_, e) {
    return ['case', e];
  }, function (_, _2) {
    return ['default'];
  }, function (_, _2, p, _3, b) {
    return ['catch', p, b];
  }, function (_, b) {
    return ['finally', b];
  }, function (_, n, _2, p, _3, b) {
    return ['functionDecl', n, p, b];
  }, function (_, n, _2, p, _3, b) {
    return ['functionExpr', n[0], p, b];
  }, function (ps, _2, b) {
    return ['arrow', ps, b];
  }, function (ps, _2, e) {
    return ['lambda', ps, e];
  }, function (id) {
    return [['def', id]];
  }, function (_, ps, _2) {
    return ps;
  }, function (_, n, _2, _3, b) {
    return ['getter', n, [], b];
  }, function (_, n, _2, p, _3, b) {
    return ['setter', n, [p], b];
  }, function (n, _, p, _2, b) {
    return ['method', n, p, b];
  }, function (_) {
    return SKIP;
  }, function (pfx, id) {
    return ['use', pfx + id];
  }, function (pfx, id) {
    return ['def', pfx + id];
  }, function (op, decls) {
    return [op, decls];
  }, function (d) {
    return ['data', JSON.parse(d)];
  }, function (fname, _2, expr, _3) {
    return ['call', ['use', fname], [expr]];
  }, function (p, _, e) {
    return ['bind', p, e];
  }, function (p, _, e) {
    return ['bind', p, e];
  }, function (_, _2, d) {
    return ['importBind', [['as', '*', d[1]]]];
  }, function (n) {
    return ['importBind', n];
  }, function (d, _, _2, d2) {
    return ['importBind', [['as', 'default', d[1]], ['as', '*', d2[1]]]];
  }, function (d, n) {
    return ['importBind', [['as', 'default', d[1]]].concat(_toConsumableArray(n))];
  }, function (d) {
    return ['importBind', [['as', 'default', d[1]]]];
  }, function (n) {
    return ['importBind', n];
  }, function (d) {
    return ['as', d[1], d[1]];
  }, function (i, _, d) {
    return ['as', i, d[1]];
  }, function (d) {
    return ['as', d[1], d[1]];
  }, function (w) {
    return ['as', w, w];
  }, function (_, s, _2) {
    return s;
  }, function (_, s, _2) {
    return s;
  }, function (s) {
    var mod = JSON.parse(s);
    return isSafeModule(mod) ? mod : FAIL;
  }, function (_, v, _2, s, _3) {
    return ['import', v, JSON.parse(s)];
  }, function (_, v, _2, s, _3) {
    return ['import', v, s];
  }, function (_, _2, e, _3) {
    return ['exportDefault', e];
  }, function (_, d) {
    return ['export'].concat(_toConsumableArray(d));
  });
  var jessieExprTag = peg.extends(jessieTag)(_templateObject2(), function (e) {
    return function () {
      return e;
    };
  });
  return [jessieTag, jessieExprTag];
});
var _default = makeJessie;
exports.default = _default;
},{"@agoric/jessie":"YilW"}],"My9u":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _jessie = require("@agoric/jessie");

function _templateObject() {
  var data = _taggedTemplateLiteral(["\n# to be overridden or inherited\nstart <- _WS assignExpr _EOF                ", ";\n\n# to be extended\nprimaryExpr <- dataStructure;\n\ndataStructure <-\n  dataLiteral                             ", "\n/ array\n/ record\n/ HOLE                                    ", ";\n\n# An expression without side-effects.\n# to be extended\npureExpr <-\n  dataLiteral                             ", "\n/ pureArray\n/ pureRecord\n/ HOLE                                    ", ";\n\ndataLiteral <- ((\"null\" / \"false\" / \"true\") _WSN / NUMBER / STRING) _WS;\n\npureArray <-\n  LEFT_BRACKET pureExpr ** _COMMA _COMMA? RIGHT_BRACKET ", ";\n\narray <-\n  LEFT_BRACKET element ** _COMMA _COMMA? RIGHT_BRACKET ", ";\n\n# to be extended\nelement <- assignExpr;\n\n# The JavaScript and JSON grammars calls records \"objects\"\n\npureRecord <-\n  LEFT_BRACE purePropDef ** _COMMA _COMMA? RIGHT_BRACE  ", ";\n\nrecord <-\n  LEFT_BRACE propDef ** _COMMA _COMMA? RIGHT_BRACE  ", ";\n\n# to be extended\npurePropDef <- propName COLON pureExpr     ", ";\n\n# to be extended\npropDef <- propName COLON assignExpr       ", ";\n\n# to be extended\npropName <- STRING                     ", ";\n\n# to be overridden\nassignExpr <- primaryExpr;\n\n# Lexical syntax\n\n_EOF <- ~.;\nLEFT_BRACKET <- \"[\" _WS;\nRIGHT_BRACKET <- \"]\" _WS;\nLEFT_BRACE <- \"{\" _WS;\nRIGHT_BRACE <- \"}\" _WS;\n_COMMA <- \",\" _WS                     ", ";\nCOLON <- \":\" _WS;\nMINUS <- \"-\" _WS;\nHOLE <- &", " _WS;\n\nSTRING <- < '\"' (~'\"' character)* '\"' > _WS;\n\nutf8 <-\n  [\xC2-\xDF] utf8cont\n/ [\xE0-\xEF] utf8cont utf8cont\n/ [\xF0-\xF4] utf8cont utf8cont utf8cont;\n\nutf8cont <- [\x80-\xBF];\n\ncharacter <-\n  escape\n/ '\\u' hex hex hex hex\n/ ~'\\' ([ -\x7F] / utf8);\n\nescape <- '\\' ['\"\\bfnrt];\nhex <- digit / [a-fA-F];\n\nNUMBER <- < int frac? exp? > _WSN;\n\nint <- [1-9] digit+\n/ digit\n/ MINUS digit\n/ MINUS [1-9] digit+;\n\ndigit <- [0-9];\n\nfrac <- '.' digit+;\nexp <- [Ee] [+-]? digit+;\n\n# _WSN is whitespace or a non-ident character.\n_WSN <- ~[$A-Za-z_] _WS    ", ";\n_WS <- [\t\n\r ]*          ", ";\n"], ["\n# to be overridden or inherited\nstart <- _WS assignExpr _EOF                ", ";\n\n# to be extended\nprimaryExpr <- dataStructure;\n\ndataStructure <-\n  dataLiteral                             ", "\n/ array\n/ record\n/ HOLE                                    ", ";\n\n# An expression without side-effects.\n# to be extended\npureExpr <-\n  dataLiteral                             ", "\n/ pureArray\n/ pureRecord\n/ HOLE                                    ", ";\n\ndataLiteral <- ((\"null\" / \"false\" / \"true\") _WSN / NUMBER / STRING) _WS;\n\npureArray <-\n  LEFT_BRACKET pureExpr ** _COMMA _COMMA? RIGHT_BRACKET ", ";\n\narray <-\n  LEFT_BRACKET element ** _COMMA _COMMA? RIGHT_BRACKET ", ";\n\n# to be extended\nelement <- assignExpr;\n\n# The JavaScript and JSON grammars calls records \"objects\"\n\npureRecord <-\n  LEFT_BRACE purePropDef ** _COMMA _COMMA? RIGHT_BRACE  ", ";\n\nrecord <-\n  LEFT_BRACE propDef ** _COMMA _COMMA? RIGHT_BRACE  ", ";\n\n# to be extended\npurePropDef <- propName COLON pureExpr     ", ";\n\n# to be extended\npropDef <- propName COLON assignExpr       ", ";\n\n# to be extended\npropName <- STRING                     ", ";\n\n# to be overridden\nassignExpr <- primaryExpr;\n\n# Lexical syntax\n\n_EOF <- ~.;\nLEFT_BRACKET <- \"[\" _WS;\nRIGHT_BRACKET <- \"]\" _WS;\nLEFT_BRACE <- \"{\" _WS;\nRIGHT_BRACE <- \"}\" _WS;\n_COMMA <- \",\" _WS                     ", ";\nCOLON <- \":\" _WS;\nMINUS <- \"-\" _WS;\nHOLE <- &", " _WS;\n\nSTRING <- < '\"' (~'\"' character)* '\"' > _WS;\n\nutf8 <-\n  [\\xc2-\\xdf] utf8cont\n/ [\\xe0-\\xef] utf8cont utf8cont\n/ [\\xf0-\\xf4] utf8cont utf8cont utf8cont;\n\nutf8cont <- [\\x80-\\xbf];\n\ncharacter <-\n  escape\n/ '\\\\u' hex hex hex hex\n/ ~'\\\\' ([\\x20-\\x7f] / utf8);\n\nescape <- '\\\\' ['\"\\\\bfnrt];\nhex <- digit / [a-fA-F];\n\nNUMBER <- < int frac? exp? > _WSN;\n\nint <- [1-9] digit+\n/ digit\n/ MINUS digit\n/ MINUS [1-9] digit+;\n\ndigit <- [0-9];\n\nfrac <- '.' digit+;\nexp <- [Ee] [+\\-]? digit+;\n\n# _WSN is whitespace or a non-ident character.\n_WSN <- ~[$A-Za-z_] _WS    ", ";\n_WS <- [\\t\\n\\r ]*          ", ";\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

// Subsets of JavaScript, starting from the grammar as defined at
// http://www.ecma-international.org/ecma-262/9.0/#sec-grammar-summary
// Defined to be extended into the Jessie grammar.
// See https://github.com/Agoric/Jessie/blob/master/README.md
// for documentation of the Jessie grammar.
// See also json.org
/// <reference path="peg.d.ts"/>
var makeJSON = (0, _jessie.insulate)(function (peg) {
  var FAIL = peg.FAIL,
      HOLE = peg.HOLE,
      SKIP = peg.SKIP;
  return peg(_templateObject(), function (v) {
    return function () {
      return v;
    };
  }, function (n) {
    return ['data', JSON.parse(n)];
  }, function (h) {
    return ['exprHole', h];
  }, function (n) {
    return ['data', JSON.parse(n)];
  }, function (h) {
    return ['exprHole', h];
  }, function (_, es, _2) {
    return ['array', es];
  }, function (_, es, _2) {
    return ['array', es];
  }, function (_, ps, _2) {
    return ['record', ps];
  }, function (_, ps, _2) {
    return ['record', ps];
  }, function (k, _, e) {
    return ['prop', k, e];
  }, function (k, _, e) {
    return ['prop', k, e];
  }, function (str) {
    var js = JSON.parse(str);

    if (js === '__proto__') {
      // Don't allow __proto__ behaviour attacks.
      return FAIL;
    }

    return ['data', js];
  }, function (_) {
    return SKIP;
  }, HOLE, function (_) {
    return SKIP;
  }, function (_) {
    return SKIP;
  });
});
var _default = makeJSON;
exports.default = _default;
},{"@agoric/jessie":"YilW"}],"fln+":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.qrepack = exports.qunpack = void 0;

var _jessie = require("@agoric/jessie");

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var qunpack = (0, _jessie.insulate)(function (h, ms, t) {
  return [h].concat(_toConsumableArray(ms), [t]);
});
exports.qunpack = qunpack;
var qrepack = (0, _jessie.insulate)(function (parts) {
  // TODO bug: We only provide the raw form at this time. I
  // apologize once again for allowing a cooked form into the
  // standard.
  var raw = [parts[0]];
  var argExprs = [];
  var len = parts.length;

  for (var i = 1; i < len; i += 2) {
    argExprs.push(parts[i]);
    raw.push(parts[i + 1]);
  }

  var template = [].concat(raw);
  template.raw = raw;
  return [['data', template]].concat(argExprs);
});
exports.qrepack = qrepack;
},{"@agoric/jessie":"YilW"}],"X5zO":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _jessie = require("@agoric/jessie");

var _quasiUtils = require("./quasi-utils.mjs");

function _templateObject() {
  var data = _taggedTemplateLiteral(["\n    # to be overridden or inherited\n    start <- _WS assignExpr _EOF                       ", ";\n\n    # A.1 Lexical Grammar\n\n    DOT <- \".\" _WS;\n    ELLIPSIS <- \"...\" _WS;\n    LEFT_PAREN <- \"(\" _WS;\n    PLUS <- \"+\" _WS;\n    QUESTION <- \"?\" _WS;\n    RIGHT_PAREN <- \")\" _WS;\n    STARSTAR <- \"**\" _WS;\n\n    # Define Javascript-style comments.\n    _WS <- super._WS (EOL_COMMENT / MULTILINE_COMMENT)?   ", ";\n    EOL_COMMENT <- \"//\" (~[\n\r] .)* _WS;\n    MULTILINE_COMMENT <- \"/*\" (~\"*/\" .)* \"*/\" _WS;\n\n    # Add single-quoted strings.\n    STRING <-\n      super.STRING\n    / \"'\" < (~\"'\" character)* > \"'\" _WS  ", ";\n\n    # Only match if whitespace doesn't contain newline\n    _NO_NEWLINE <- ~IDENT [ \t]*     ", ";\n\n    IDENT_NAME <- ~(HIDDEN_PFX / \"__proto__\") (IDENT / RESERVED_WORD);\n\n    IDENT <-\n      ~(HIDDEN_PFX / IMPORT_PFX / \"insulate\" / RESERVED_WORD)\n      < [$A-Za-z_] [$A-Za-z0-9_]* > _WSN;\n    HIDDEN_PFX <- \"$h_\";\n    IMPORT_PFX <- \"$i_\";\n\n    # Omit \"async\", \"arguments\", \"eval\", \"get\", and \"set\" from IDENT\n    # in Justin even though ES2017 considers them in IDENT.\n    RESERVED_WORD <-\n      (KEYWORD / RESERVED_KEYWORD / FUTURE_RESERVED_WORD\n    / \"null\" / \"false\" / \"true\"\n    / \"async\" / \"arguments\" / \"eval\" / \"get\" / \"set\") _WSN;\n\n    KEYWORD <-\n      (\"break\"\n    / \"case\" / \"catch\" / \"const\" / \"continue\"\n    / \"debugger\" / \"default\"\n    / \"else\" / \"export\"\n    / \"finally\" / \"for\" / \"function\"\n    / \"if\" / \"import\"\n    / \"return\"\n    / \"switch\"\n    / \"throw\" / \"try\" / \"typeof\"\n    / \"void\"\n    / \"while\") _WSN;\n\n    # Unused by Justin but enumerated here, in order to omit them\n    # from the IDENT token.\n    RESERVED_KEYWORD <-\n      (\"class\"\n    / \"delete\" / \"do\"\n    / \"extends\"\n    / \"instanceof\"\n    / \"in\"\n    / \"new\"\n    / \"super\"\n    / \"this\"\n    / \"var\"\n    / \"with\"\n    / \"yield\") _WSN;\n\n    FUTURE_RESERVED_WORD <-\n      (\"await\" / \"enum\"\n    / \"implements\" / \"package\" / \"protected\"\n    / \"interface\" / \"private\" / \"public\") _WSN;\n\n    # Quasiliterals aka template literals\n    QUASI_CHAR <- \"\\\" . / ~\"`\" .;\n    QUASI_ALL <- \"`\" < (~\"${\" QUASI_CHAR)* > \"`\" _WS;\n    QUASI_HEAD <- \"`\" < (~\"${\" QUASI_CHAR)* > \"${\" _WS;\n    QUASI_MID <- \"}\" < (~\"${\" QUASI_CHAR)* > \"${\" _WS;\n    QUASI_TAIL <- \"}\" < (~\"${\" QUASI_CHAR)* > \"`\" _WS;\n\n\n    # A.2 Expressions\n\n    dataStructure <-\n      \"undefined\" _WSN     ", "\n    / super.dataStructure;\n\n    # Optional trailing commas.\n    record <-\n      super.record\n    / LEFT_BRACE propDef ** _COMMA _COMMA? RIGHT_BRACE      ", ";\n\n    array <-\n      super.array\n    / LEFT_BRACKET element ** _COMMA _COMMA? RIGHT_BRACKET  ", ";\n\n    useVar <- IDENT                                       ", ";\n\n    # Justin does not contain variable definitions, only uses. However,\n    # multiple languages that extend Justin will contain defining\n    # occurrences of variable names, so we put the defVar production\n    # here.\n    defVar <- IDENT                                       ", ";\n\n\n    primaryExpr <-\n      super.primaryExpr\n    / quasiExpr\n    / LEFT_PAREN expr RIGHT_PAREN                         ", "\n    / useVar;\n\n    pureExpr <-\n      super.pureExpr\n    / LEFT_PAREN pureExpr RIGHT_PAREN                     ", "\n    / useVar;\n\n    element <-\n      super.element\n    / ELLIPSIS assignExpr                                 ", ";\n\n    propDef <-\n      super.propDef\n    / useVar                                              ", "\n    / ELLIPSIS assignExpr                                 ", ";\n\n    purePropDef <-\n      super.purePropDef\n    / useVar                                              ", "\n    / ELLIPSIS assignExpr                                 ", ";\n\n    # No computed property name\n    propName <-\n      super.propName\n    / IDENT_NAME\n    / NUMBER;\n\n    quasiExpr <-\n      QUASI_ALL                                            ", "\n    / QUASI_HEAD expr ** QUASI_MID QUASI_TAIL              ", ";\n\n    # to be extended\n    memberPostOp <-\n      LEFT_BRACKET indexExpr RIGHT_BRACKET                 ", "\n    / DOT IDENT_NAME                                       ", "\n    / quasiExpr                                            ", ";\n\n    # to be extended\n    callPostOp <-\n      memberPostOp\n    / args                                                 ", ";\n\n    # Because Justin and Jessie have no \"new\" or \"super\", they don't need\n    # to distinguish callExpr from memberExpr. So justin omits memberExpr\n    # and newExpr. Instead, in Justin, callExpr jumps directly to\n    # primaryExpr and updateExpr jumps directly to callExpr.\n\n    # to be overridden.\n    callExpr <- primaryExpr callPostOp*                   ", ";\n\n    # To be overridden rather than inherited.\n    # Introduced to impose a non-JS restriction\n    # Restrict index access to number-names, including\n    # floating point, NaN, Infinity, and -Infinity.\n    indexExpr <-\n      NUMBER                                               ", "\n    / PLUS unaryExpr                                       ", ";\n\n    args <- LEFT_PAREN arg ** _COMMA RIGHT_PAREN            ", ";\n\n    arg <-\n      assignExpr\n    / ELLIPSIS assignExpr                                  ", ";\n\n    # to be overridden\n    updateExpr <- callExpr;\n\n    unaryExpr <-\n      preOp unaryExpr                                      ", "\n    / updateExpr;\n\n    # to be extended\n    # No prefix or postfix \"++\" or \"--\".\n    # No \"delete\".\n    preOp <- ((\"void\" / \"typeof\") _WSN / prePre);\n    prePre <- (\"+\" / \"-\" / \"~\" / \"!\") _WS                 ", ";\n\n    # Different communities will think -x**y parses in different ways,\n    # so the EcmaScript grammar forces parens to disambiguate.\n    powExpr <-\n      updateExpr STARSTAR powExpr                          ", "\n    / unaryExpr;\n\n    multExpr <- powExpr (multOp powExpr)*                  ", ";\n    addExpr <- multExpr (addOp multExpr)*                  ", ";\n    shiftExpr <- addExpr (shiftOp addExpr)*                ", ";\n\n    # Non-standard, to be overridden\n    # In C-like languages, the precedence and associativity of the\n    # relational, equality, and bitwise operators is surprising, and\n    # therefore hazardous. Here, none of these associate with the\n    # others, forcing parens to disambiguate.\n    eagerExpr <- shiftExpr (eagerOp shiftExpr)?            ", ";\n\n    andThenExpr <- eagerExpr (andThenOp eagerExpr)*       ", ";\n    orElseExpr <- andThenExpr (orElseOp andThenExpr)*     ", ";\n\n    multOp <- (\"*\" / \"/\" / \"%\") _WS;\n    addOp <- (\"+\" / \"-\") _WS;\n    shiftOp <- (\"<<\" / \">>>\" / \">>\") _WS;\n    relOp <- (\"<=\" / \"<\" / \">=\" / \">\") _WS;\n    eqOp <- (\"===\" / \"!==\") _WS;\n    bitOp <- (\"&\" / \"^\" / \"|\") _WS;\n\n    eagerOp <- relOp / eqOp / bitOp;\n\n    andThenOp <- \"&&\" _WS;\n    orElseOp <- \"||\" _WS;\n\n    condExpr <-\n      orElseExpr QUESTION assignExpr COLON assignExpr   ", "\n    / orElseExpr;\n\n    # override, to be extended\n    assignExpr <- condExpr;\n\n    # The comma expression is not in Jessie because we\n    # opt to pass only insulated expressions as the this-binding.\n    expr <- assignExpr;\n  "], ["\n    # to be overridden or inherited\n    start <- _WS assignExpr _EOF                       ", ";\n\n    # A.1 Lexical Grammar\n\n    DOT <- \".\" _WS;\n    ELLIPSIS <- \"...\" _WS;\n    LEFT_PAREN <- \"(\" _WS;\n    PLUS <- \"+\" _WS;\n    QUESTION <- \"?\" _WS;\n    RIGHT_PAREN <- \")\" _WS;\n    STARSTAR <- \"**\" _WS;\n\n    # Define Javascript-style comments.\n    _WS <- super._WS (EOL_COMMENT / MULTILINE_COMMENT)?   ", ";\n    EOL_COMMENT <- \"//\" (~[\\n\\r] .)* _WS;\n    MULTILINE_COMMENT <- \"/*\" (~\"*/\" .)* \"*/\" _WS;\n\n    # Add single-quoted strings.\n    STRING <-\n      super.STRING\n    / \"'\" < (~\"'\" character)* > \"'\" _WS  ", ";\n\n    # Only match if whitespace doesn't contain newline\n    _NO_NEWLINE <- ~IDENT [ \\t]*     ", ";\n\n    IDENT_NAME <- ~(HIDDEN_PFX / \"__proto__\") (IDENT / RESERVED_WORD);\n\n    IDENT <-\n      ~(HIDDEN_PFX / IMPORT_PFX / \"insulate\" / RESERVED_WORD)\n      < [$A-Za-z_] [$A-Za-z0-9_]* > _WSN;\n    HIDDEN_PFX <- \"$h_\";\n    IMPORT_PFX <- \"$i_\";\n\n    # Omit \"async\", \"arguments\", \"eval\", \"get\", and \"set\" from IDENT\n    # in Justin even though ES2017 considers them in IDENT.\n    RESERVED_WORD <-\n      (KEYWORD / RESERVED_KEYWORD / FUTURE_RESERVED_WORD\n    / \"null\" / \"false\" / \"true\"\n    / \"async\" / \"arguments\" / \"eval\" / \"get\" / \"set\") _WSN;\n\n    KEYWORD <-\n      (\"break\"\n    / \"case\" / \"catch\" / \"const\" / \"continue\"\n    / \"debugger\" / \"default\"\n    / \"else\" / \"export\"\n    / \"finally\" / \"for\" / \"function\"\n    / \"if\" / \"import\"\n    / \"return\"\n    / \"switch\"\n    / \"throw\" / \"try\" / \"typeof\"\n    / \"void\"\n    / \"while\") _WSN;\n\n    # Unused by Justin but enumerated here, in order to omit them\n    # from the IDENT token.\n    RESERVED_KEYWORD <-\n      (\"class\"\n    / \"delete\" / \"do\"\n    / \"extends\"\n    / \"instanceof\"\n    / \"in\"\n    / \"new\"\n    / \"super\"\n    / \"this\"\n    / \"var\"\n    / \"with\"\n    / \"yield\") _WSN;\n\n    FUTURE_RESERVED_WORD <-\n      (\"await\" / \"enum\"\n    / \"implements\" / \"package\" / \"protected\"\n    / \"interface\" / \"private\" / \"public\") _WSN;\n\n    # Quasiliterals aka template literals\n    QUASI_CHAR <- \"\\\\\" . / ~\"\\`\" .;\n    QUASI_ALL <- \"\\`\" < (~\"\\${\" QUASI_CHAR)* > \"\\`\" _WS;\n    QUASI_HEAD <- \"\\`\" < (~\"\\${\" QUASI_CHAR)* > \"\\${\" _WS;\n    QUASI_MID <- \"}\" < (~\"\\${\" QUASI_CHAR)* > \"\\${\" _WS;\n    QUASI_TAIL <- \"}\" < (~\"\\${\" QUASI_CHAR)* > \"\\`\" _WS;\n\n\n    # A.2 Expressions\n\n    dataStructure <-\n      \"undefined\" _WSN     ", "\n    / super.dataStructure;\n\n    # Optional trailing commas.\n    record <-\n      super.record\n    / LEFT_BRACE propDef ** _COMMA _COMMA? RIGHT_BRACE      ", ";\n\n    array <-\n      super.array\n    / LEFT_BRACKET element ** _COMMA _COMMA? RIGHT_BRACKET  ", ";\n\n    useVar <- IDENT                                       ", ";\n\n    # Justin does not contain variable definitions, only uses. However,\n    # multiple languages that extend Justin will contain defining\n    # occurrences of variable names, so we put the defVar production\n    # here.\n    defVar <- IDENT                                       ", ";\n\n\n    primaryExpr <-\n      super.primaryExpr\n    / quasiExpr\n    / LEFT_PAREN expr RIGHT_PAREN                         ", "\n    / useVar;\n\n    pureExpr <-\n      super.pureExpr\n    / LEFT_PAREN pureExpr RIGHT_PAREN                     ", "\n    / useVar;\n\n    element <-\n      super.element\n    / ELLIPSIS assignExpr                                 ", ";\n\n    propDef <-\n      super.propDef\n    / useVar                                              ", "\n    / ELLIPSIS assignExpr                                 ", ";\n\n    purePropDef <-\n      super.purePropDef\n    / useVar                                              ", "\n    / ELLIPSIS assignExpr                                 ", ";\n\n    # No computed property name\n    propName <-\n      super.propName\n    / IDENT_NAME\n    / NUMBER;\n\n    quasiExpr <-\n      QUASI_ALL                                            ", "\n    / QUASI_HEAD expr ** QUASI_MID QUASI_TAIL              ", ";\n\n    # to be extended\n    memberPostOp <-\n      LEFT_BRACKET indexExpr RIGHT_BRACKET                 ", "\n    / DOT IDENT_NAME                                       ", "\n    / quasiExpr                                            ", ";\n\n    # to be extended\n    callPostOp <-\n      memberPostOp\n    / args                                                 ", ";\n\n    # Because Justin and Jessie have no \"new\" or \"super\", they don't need\n    # to distinguish callExpr from memberExpr. So justin omits memberExpr\n    # and newExpr. Instead, in Justin, callExpr jumps directly to\n    # primaryExpr and updateExpr jumps directly to callExpr.\n\n    # to be overridden.\n    callExpr <- primaryExpr callPostOp*                   ", ";\n\n    # To be overridden rather than inherited.\n    # Introduced to impose a non-JS restriction\n    # Restrict index access to number-names, including\n    # floating point, NaN, Infinity, and -Infinity.\n    indexExpr <-\n      NUMBER                                               ", "\n    / PLUS unaryExpr                                       ", ";\n\n    args <- LEFT_PAREN arg ** _COMMA RIGHT_PAREN            ", ";\n\n    arg <-\n      assignExpr\n    / ELLIPSIS assignExpr                                  ", ";\n\n    # to be overridden\n    updateExpr <- callExpr;\n\n    unaryExpr <-\n      preOp unaryExpr                                      ", "\n    / updateExpr;\n\n    # to be extended\n    # No prefix or postfix \"++\" or \"--\".\n    # No \"delete\".\n    preOp <- ((\"void\" / \"typeof\") _WSN / prePre);\n    prePre <- (\"+\" / \"-\" / \"~\" / \"!\") _WS                 ", ";\n\n    # Different communities will think -x**y parses in different ways,\n    # so the EcmaScript grammar forces parens to disambiguate.\n    powExpr <-\n      updateExpr STARSTAR powExpr                          ", "\n    / unaryExpr;\n\n    multExpr <- powExpr (multOp powExpr)*                  ", ";\n    addExpr <- multExpr (addOp multExpr)*                  ", ";\n    shiftExpr <- addExpr (shiftOp addExpr)*                ", ";\n\n    # Non-standard, to be overridden\n    # In C-like languages, the precedence and associativity of the\n    # relational, equality, and bitwise operators is surprising, and\n    # therefore hazardous. Here, none of these associate with the\n    # others, forcing parens to disambiguate.\n    eagerExpr <- shiftExpr (eagerOp shiftExpr)?            ", ";\n\n    andThenExpr <- eagerExpr (andThenOp eagerExpr)*       ", ";\n    orElseExpr <- andThenExpr (orElseOp andThenExpr)*     ", ";\n\n    multOp <- (\"*\" / \"/\" / \"%\") _WS;\n    addOp <- (\"+\" / \"-\") _WS;\n    shiftOp <- (\"<<\" / \">>>\" / \">>\") _WS;\n    relOp <- (\"<=\" / \"<\" / \">=\" / \">\") _WS;\n    eqOp <- (\"===\" / \"!==\") _WS;\n    bitOp <- (\"&\" / \"^\" / \"|\") _WS;\n\n    eagerOp <- relOp / eqOp / bitOp;\n\n    andThenOp <- \"&&\" _WS;\n    orElseOp <- \"||\" _WS;\n\n    condExpr <-\n      orElseExpr QUESTION assignExpr COLON assignExpr   ", "\n    / orElseExpr;\n\n    # override, to be extended\n    assignExpr <- condExpr;\n\n    # The comma expression is not in Jessie because we\n    # opt to pass only insulated expressions as the this-binding.\n    expr <- assignExpr;\n  "]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var qunpack = (0, _jessie.insulate)(_quasiUtils.qunpack);
var binary = (0, _jessie.insulate)(function (left, rights) {
  return rights.reduce(function (prev, _ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        op = _ref2[0],
        right = _ref2[1];

    return [op, prev, right];
  }, left);
});
var transformSingleQuote = (0, _jessie.insulate)(function (s) {
  var i = 0,
      qs = '';

  while (i < s.length) {
    var c = s.slice(i, i + 1);

    if (c === '\\') {
      // Skip one char.
      qs += s.slice(i, i + 2);
      i += 2;
    } else if (c === '"') {
      // Quote it.
      qs += '\\"';
      i++;
    } else {
      // Add it directly.
      qs += c;
      i++;
    }
  }

  return "\"".concat(qs, "\"");
});
var makeJustin = (0, _jessie.insulate)(function (peg) {
  var SKIP = peg.SKIP;
  return peg(_templateObject(), function (v) {
    return function () {
      return v;
    };
  }, function (_) {
    return SKIP;
  }, function (s) {
    return transformSingleQuote(s);
  }, function (_) {
    return SKIP;
  }, function (_) {
    return ['data', undefined];
  }, function (_, ps, _2) {
    return ['record', ps];
  }, function (_, es, _2) {
    return ['array', es];
  }, function (id) {
    return ['use', id];
  }, function (id) {
    return ['def', id];
  }, function (_, e, _2) {
    return e;
  }, function (_, e, _2) {
    return e;
  }, function (_, e) {
    return ['spread', e];
  }, function (u) {
    return ['prop', u[1], u];
  }, function (_, e) {
    return ['spreadObj', e];
  }, function (u) {
    return ['prop', u[1], u];
  }, function (_, e) {
    return ['spreadObj', e];
  }, function (q) {
    return ['quasi', [q]];
  }, function (h, ms, t) {
    return ['quasi', qunpack(h, ms, t)];
  }, function (_, e, _3) {
    return ['index', e];
  }, function (_, id) {
    return ['get', id];
  }, function (q) {
    return ['tag', q];
  }, function (args) {
    return ['call', args];
  }, binary, function (n) {
    return ['data', JSON.parse(n)];
  }, function (_, e) {
    return ["pre:+", e];
  }, function (_, args, _2) {
    return args;
  }, function (_, e) {
    return ['spread', e];
  }, function (op, e) {
    return [op, e];
  }, function (op) {
    return "pre:".concat(op);
  }, function (x, op, y) {
    return [op, x, y];
  }, binary, binary, binary, binary, binary, binary, function (c, _, t, _2, e) {
    return ['cond', c, t, e];
  });
});
var _default = makeJustin;
exports.default = _default;
},{"@agoric/jessie":"YilW","./quasi-utils.mjs":"fln+"}],"SAPa":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _jessie = require("@agoric/jessie");

var _slog = require("@michaelfig/slog");

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _templateObject() {
  var data = _taggedTemplateLiteral(["No rewriter for ", ""]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _nonIterableRest(); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var slog = (0, _jessie.insulate)(_slog.slog);
var hide = (0, _jessie.insulate)(function (vname) {
  return "$h_".concat(vname);
}); // Return a string separated by separators.

var separate = (0, _jessie.insulate)(function (strs, sep) {
  var ret = '';
  var actualSep = '';
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = strs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var str = _step.value;

      if (str !== '') {
        ret += actualSep + str;
        actualSep = sep;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return ret;
});
var moduleRewriteDefine = (0, _jessie.insulate)(function (moduleAST) {
  var DEFINE = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : hide('define');
  var EXPORTS = hide('exports');
  var imports = (0, _jessie.makeMap)();
  var exportVars = (0, _jessie.makeSet)();
  var starName;
  var nImport = 0;
  var rewriters = {
    as: function as(imp, sym) {
      if (imp === '*') {
        starName = sym;
        return '';
      }

      return "".concat(imp, ": ").concat(sym);
    },
    bind: function bind(def, expr) {
      var name = doRewrite(def);
      return "".concat(name, " = ").concat(doRewrite(expr));
    },
    def: function def(name) {
      exportVars.add(name);
      return name;
    },
    exportDefaultX: function exportDefaultX(val) {
      return "".concat(EXPORTS, ".default = ").concat(doRewrite(val), ";");
    },
    exportX: function exportX(qual, binds) {
      exportVars.clear();
      var bindings = separate(binds.map(doRewrite), ', ');
      var assign = '';
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = exportVars.keys()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var vname = _step2.value;
          assign += "".concat(EXPORTS, ".").concat(vname, " = ").concat(vname, ";\n");
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      exportVars.clear();
      return "".concat(qual, " ").concat(bindings, ";\n").concat(assign);
    },
    import: function _import(clause, fromModule) {
      // Save the bindings.
      starName = undefined;
      var bindings = doRewrite(clause);

      if (starName === undefined) {
        starName = hide("star".concat(nImport++));
      }

      imports.set(fromModule, starName);

      if (bindings) {
        return "const {".concat(bindings, "} = ").concat(starName, ";\n");
      }

      return '';
    },
    importBind: function importBind(bindings) {
      return separate(bindings.map(doRewrite), ', ');
    },
    matchArray: function matchArray(es) {
      return "[".concat(separate(es.map(doRewrite), ', '), "]");
    },
    matchProp: function matchProp(kw, prop) {
      var rewrite = doRewrite(prop);

      if (kw === rewrite) {
        return kw;
      }

      return "".concat(kw, ": ").concat(rewrite);
    },
    matchRecord: function matchRecord(es) {
      return "{".concat(separate(es.map(doRewrite), ', '), "}");
    },
    moduleX: function moduleX(decls) {
      var body = decls.reduce(function (prior, cur) {
        return prior + doRewrite(cur);
      }, '');
      var modules = [];
      var names = [];
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = imports.entries()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var _step3$value = _slicedToArray(_step3.value, 2),
              mod = _step3$value[0],
              name = _step3$value[1];

          modules.push(mod);
          names.push(name);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      var bindings = separate(names, ', ');
      return "".concat(DEFINE, "(\n").concat(JSON.stringify(modules), ",\n(").concat(bindings, ") => {\nconst ").concat(EXPORTS, " = {};\n").concat(body, "\nreturn ").concat(EXPORTS, ";\n})");
    },
    rest: function rest(expr) {
      return "...".concat(doRewrite(expr));
    },
    restObj: function restObj(expr) {
      return "...".concat(doRewrite(expr));
    }
  };

  var doRewrite = function doRewrite(node) {
    if (typeof node === 'string') {
      return node;
    }

    var _node = _toArray(node),
        name = _node[0],
        args = _node.slice(1);

    var rewriter = rewriters[name];

    if (!rewriter) {
      throw slog.error(_templateObject(), {
        name: name
      });
    }

    return rewriter.apply(void 0, _toConsumableArray(args));
  };

  return doRewrite(moduleAST);
});
var _default = moduleRewriteDefine;
exports.default = _default;
},{"@agoric/jessie":"YilW","@michaelfig/slog":"Ipmo"}],"ZHvC":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _jessie = require("@agoric/jessie");

/// <reference path="./peg.d.ts"/>
var tagString = (0, _jessie.insulate)(function (tag, uri) {
  function tagged(templateOrFlag) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    if (typeof templateOrFlag === 'string') {
      return tagString(tag(templateOrFlag), uri);
    }

    var template = templateOrFlag;
    var cooked = template.reduce(function (prior, t, i) {
      prior.push(t, String(args[i]));
      return prior;
    }, []);
    cooked.push(template[template.length - 1]);
    var cooked0 = cooked.join('');
    var raw0 = args.reduce(function (prior, hole, i) {
      prior.push(String(hole), template.raw[i + 1]);
      return prior;
    }, [template.raw[0]]).join('');
    var sources0 = {
      byte: 0,
      column: 1,
      line: 1,
      uri: uri
    };
    var tmpl = [cooked0];
    tmpl.raw = [raw0];
    tmpl.sources = [sources0];
    return tag(tmpl);
  }

  tagged.parserCreator = tag.parserCreator;
  tagged._asExtending = tag._asExtending;
  return tagged;
});
var _default = tagString;
exports.default = _default;
},{"@agoric/jessie":"YilW"}],"bRI1":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.translate = void 0;

var _jessie = require("@agoric/jessie");

var _slog = require("@michaelfig/slog");

var _bootPeg = _interopRequireDefault(require("./boot-peg.mjs"));

var _bootPegast = _interopRequireDefault(require("./boot-pegast.mjs"));

var _quasiPeg = _interopRequireDefault(require("./quasi-peg.mjs"));

var _quasiJessieModule = _interopRequireDefault(require("./quasi-jessie-module.mjs"));

var _quasiJessie = _interopRequireDefault(require("./quasi-jessie.mjs"));

var _quasiJson = _interopRequireDefault(require("./quasi-json.mjs"));

var _quasiJustin = _interopRequireDefault(require("./quasi-justin.mjs"));

var _rewriteDefine = _interopRequireDefault(require("./rewrite-define.mjs"));

var _tagString = _interopRequireDefault(require("./tag-string.mjs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _templateObject5() {
  var data = _taggedTemplateLiteral(["Unrecognized targetType: ", ""]);

  _templateObject5 = function _templateObject5() {
    return data;
  };

  return data;
}

function _templateObject4() {
  var data = _taggedTemplateLiteral(["", ""]);

  _templateObject4 = function _templateObject4() {
    return data;
  };

  return data;
}

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _templateObject3() {
  var data = _taggedTemplateLiteral(["", ""]);

  _templateObject3 = function _templateObject3() {
    return data;
  };

  return data;
}

function _templateObject2() {
  var data = _taggedTemplateLiteral(["Unrecognized target: ", ""]);

  _templateObject2 = function _templateObject2() {
    return data;
  };

  return data;
}

function _templateObject() {
  var data = _taggedTemplateLiteral(["Unrecognized sourceType: ", ""]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var slog = (0, _jessie.insulate)(_slog.slog);
var bootPeg = (0, _jessie.insulate)(_bootPeg.default);
var bootPegAst = (0, _jessie.insulate)(_bootPegast.default);
var makePeg = (0, _jessie.insulate)(_quasiPeg.default);
var makeJessieModule = (0, _jessie.insulate)(_quasiJessieModule.default);
var makeJessie = (0, _jessie.insulate)(_quasiJessie.default);
var makeJSON = (0, _jessie.insulate)(_quasiJson.default);
var makeJustin = (0, _jessie.insulate)(_quasiJustin.default);
var rewriteModuleDefine = (0, _jessie.insulate)(_rewriteDefine.default);
var tagString = (0, _jessie.insulate)(_tagString.default);
var pegTag = (0, _jessie.insulate)(bootPeg(makePeg, bootPegAst));
var jsonTag = (0, _jessie.insulate)(makeJSON(pegTag));
var justinTag = (0, _jessie.insulate)(makeJustin(pegTag.extends(jsonTag)));

var _insulate = (0, _jessie.insulate)(makeJessie(pegTag, pegTag.extends(justinTag))),
    _insulate2 = _slicedToArray(_insulate, 1),
    jessieTag = _insulate2[0];

var jessieModuleTag = (0, _jessie.insulate)(makeJessieModule(pegTag.extends(jessieTag)));
var translate = (0, _jessie.insulate)(function (sourceText, parameters) {
  return (0, _jessie.makePromise)(function (resolve) {
    var sourceType = parameters.sourceType,
        target = parameters.target,
        targetType = parameters.targetType;

    if (sourceType !== 'jessie') {
      throw slog.error(_templateObject(), {
        sourceType: sourceType
      });
    }

    if (target !== 'jessie-frame') {
      throw slog.error(_templateObject2(), {
        target: target
      });
    }

    switch (targetType) {
      case 'function':
        {
          var tag = tagString(jessieModuleTag, parameters.sourceURL); // Throw an exception if the sourceText doesn't parse.

          var moduleAst = tag(_templateObject3(), sourceText); // Rewrite the ESM imports/exports into an SES-honouring AMD form.

          var translatedText = rewriteModuleDefine(moduleAst, '$h_define');

          var result = _objectSpread({}, parameters, {
            translatedText: translatedText
          });

          return resolve(result);
        }

      case 'module':
        {
          var _tag = tagString(jessieTag, parameters.sourceURL); // Throw an exception if the sourceText doesn't parse.


          _tag(_templateObject4(), sourceText); // Return the sourceText verbatim.


          var _result = _objectSpread({}, parameters, {
            translatedText: sourceText
          });

          return resolve(_result);
        }

      default:
        {
          throw slog.error(_templateObject5(), {
            targetType: targetType
          });
        }
    }
  });
});
exports.translate = translate;
},{"@agoric/jessie":"YilW","@michaelfig/slog":"Ipmo","./boot-peg.mjs":"QgFk","./boot-pegast.mjs":"joiS","./quasi-peg.mjs":"3zTw","./quasi-jessie-module.mjs":"xkRL","./quasi-jessie.mjs":"NMVp","./quasi-json.mjs":"My9u","./quasi-justin.mjs":"X5zO","./rewrite-define.mjs":"SAPa","./tag-string.mjs":"ZHvC"}],"lr5t":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  whitelist: true,
  SES: true,
  translate: true,
  slog: true
};
Object.defineProperty(exports, "SES", {
  enumerable: true,
  get: function () {
    return _sesEsm.default;
  }
});
Object.defineProperty(exports, "translate", {
  enumerable: true,
  get: function () {
    return _translate.translate;
  }
});
Object.defineProperty(exports, "slog", {
  enumerable: true,
  get: function () {
    return _slog.slog;
  }
});
exports.whitelist = void 0;

var _sesEsm = _interopRequireDefault(require("./node_modules/ses/dist/ses.esm.js"));

var _whitelist = require("./whitelist.js");

var _translate = require("../../lib/translate.mjs");

var _jessie = require("@agoric/jessie");

Object.keys(_jessie).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _jessie[key];
    }
  });
});

var _slog = require("@michaelfig/slog");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var whitelist = (0, _whitelist.buildWhitelist)();
exports.whitelist = whitelist;
},{"./node_modules/ses/dist/ses.esm.js":"iDNi","./whitelist.js":"4nUr","../../lib/translate.mjs":"bRI1","@agoric/jessie":"YilW","@michaelfig/slog":"Ipmo"}]},{},["lr5t"], "jessica")
//# sourceMappingURL=jessica.d9f69d51.js.map