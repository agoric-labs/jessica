const makeSlog = (handler) => {
    const levels = makeMap();
    const names = [];
    let slog;
    for (const prep of [true, false]) {
        let i = 0;
        const doit = (level, name) => {
            if (prep) {
                names[level] = name;
                levels.set(name, level);
            }
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
        if (prep) {
            slog = doit(-1, 'DEFAULT');
        }
        else {
            const defaultLevel = levels.get('trace');
            levels.set('DEFAULT', defaultLevel);
            slog = slog.trace;
        }
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
    }
    return harden(slog);
};
export default harden(makeSlog);
