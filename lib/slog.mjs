import { insulate } from '@agoric/jessie'; 





export const contextArg = insulate((context, a) => {
  if (typeof a !== 'object' || a === null) {
    // Just stringify the argument.
    return '' + a;
  } else if (a.length !== undefined) {
    // Take the value as the (anonymous) array.
    return a;
  }
  // Deconstruct the argument object.
  let valname, val;
  for (const vname of Object.keys(a)) {
    if (vname === 'format') {
      // format = a[vname];
    } else if (valname !== undefined || typeof a[vname] === 'function') {
      // Too many members or seems to be an active object.
      return a;
    } else {
      // We have at least one non-format member.
      valname = vname;
      val = JSON.stringify(a[vname], undefined, 2);
    }
  }

  if (valname === undefined) {
    // No non-format arguments.
    return a;
  }

  if (valname[0] === '_') {
    // Do nothing.
  } else if (context.has(valname)) {
    const oval = context.get(valname);
    if (val !== oval) {
      slog.error`Context value ${{ valname }} mismatch: ${{ val }} vs. ${{ oval }}`;
    }
  } else {
    context.set(valname, val);
  }
  return val;
});

const makeSlog = insulate(handler => {
  const levels = makeMap();
  const names = [];
  const doit = (level, name) => {
    if (level >= 0) {
      names[level] = name;
      levels.set(name, level);
    }


    function tag(contextOrTemplate, ...args) {
      let context;
      if (!contextOrTemplate.raw) {
        context = makeMap([...Object.entries(contextOrTemplate)]);
        return (t, ...a) =>
        handler(level, names, levels, context, t, a);
      }
      // No specified context, this is the template tag.
      context = makeMap();
      const template = contextOrTemplate;
      return handler(level, names, levels, context, template, args);
    }
    return tag;
  };

  let i = 0;
  const slog = doit(-1, 'stringify');
  slog.panic = doit(i++, 'panic');
  slog.alert = doit(i++, 'alert');
  slog.crit = doit(i++, 'crit');
  slog.error = doit(i++, 'error');
  slog.reject = doit(i++, 'reject');
  slog.warn = doit(i++, 'warn');
  slog.notice = doit(i++, 'notice');
  slog.info = doit(i++, 'info');
  slog.debug = doit(i++, 'debug');
  slog.trace = doit(i++, 'trace');
  return slog;
});

export default makeSlog;