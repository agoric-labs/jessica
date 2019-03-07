const makeSlog = (handler) => {
    const levels = makeMap(), names = [];
    let slog = (...args) => undefined;
    for (const prep of [true, false]) {
        let i = 0, doit;
        if (prep) {
            // Just determine the levels.
            doit = (level, name) => {
                names[level] = name;
                levels.set(name, level);
                return slog;
            };
        }
        else {
            // We have levels.trace, so create the actual SLOG object.
            doit = (level, _name) => {
                function tag(contextOrTemplate, ...args) {
                    let context;
                    if (!contextOrTemplate.raw) {
                        context = makeMap([...Object.entries(contextOrTemplate)]);
                        return (t, ...a) => handler(level, names, levels, context, t, a);
                    }
                    // No specified context, this is the template tag.
                    context = makeMap();
                    const template = contextOrTemplate;
                    return handler(level, names, levels, context, template, args);
                }
                return tag;
            };
            const defaultLevel = levels.get('trace');
            levels.set('DEFAULT', defaultLevel);
            slog = doit(defaultLevel, 'DEFAULT');
        }
        slog.panic = doit(i++, 'panic');
        slog.alert = doit(i++, 'alert');
        slog.crit = doit(i++, 'crit');
        slog.error = doit(i++, 'error');
        slog.warn = doit(i++, 'warn');
        slog.notice = doit(i++, 'notice');
        slog.info = doit(i++, 'info');
        slog.debug = doit(i++, 'debug');
        slog.trace = doit(i++, 'trace');
    }
    slog.LEVELS = levels;
    slog.NAMES = names;
    return harden(slog);
};
export default harden(makeSlog);
