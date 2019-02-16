const makeSlog = (handler, setMapFrom) => {
    let levels = makeMap(), names = [], slog;
    for (const create of [false, true]) {
        let i = 0, doit;
        if (create) {
            // We have levels.trace, so create the actual SLOG object.
            doit = (level, _name) =>
                (contextOrTemplate, ...args) => {
                    const context = makeMap();
                    if (contextOrTemplate.length === undefined) {
                        setMapFrom(context, contextOrTemplate);
                        return (template, ...args) =>
                            handler(level, names, levels, context, template, args);
                    }
                    // No specified context, this is the template tag.
                    const template = contextOrTemplate;
                    return handler(level, names, levels, context, template, args);
                };
            let defaultLevel = levels.get('trace');
            levels.set('default', defaultLevel);
            slog = doit(defaultLevel, 'default');
        }
        else {
            // Just determine the levels.
            doit = (level, name) => {
                names[level] = name;
                levels.set(name, level);
                return [undefined, level];
            };
            slog = {};
        }
        slog.panic = doit(i ++, 'panic');
        slog.alert = doit(i ++, 'alert');
        slog.crit = doit(i ++, 'crit');
        slog.error = doit(i ++, 'error');
        slog.warn = doit(i ++, 'warn');
        slog.notice = doit(i ++, 'notice');
        slog.info = doit(i ++, 'info');
        slog.debug = doit(i ++, 'debug');
        slog.trace = doit(i ++, 'trace');
    }
    slog.LEVELS = levels;
    slog.NAMES = names;
    return harden(slog);
};

export default harden(makeSlog);
