// DO NOT EDIT - Generated automatically from slog.mjs.ts by tessc






const makeSlog = immunize(handler => {
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

export default immunize(makeSlog);