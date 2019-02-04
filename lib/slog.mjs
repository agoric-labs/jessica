const makeSlog = (handler, setMapFrom) => {
    let levels = {}, slog;
    for (const create of [false, true]) {
        let i = 0, doit;
        if (create) {
            // We have levels.trace, so create the actual SLOG object.
            doit = (level) =>
                [(contextOrTemplate, ...args) => {
                    const context = makeMap();
                    if (contextOrTemplate.length === undefined) {
                        setMapFrom(context, contextOrTemplate);
                        return (template, ...args) =>
                            handler(level, context, template, args);
                    }
                    // No specified context, this is the template tag.
                    const template = contextOrTemplate;
                    return handler(level, context, template, args);
                }, level];
            [slog, levels.default] = doit(levels.trace);
        }
        else {
            // Just determine the levels.
            doit = (level) => [undefined, level];
            slog = {};
        }
        [slog.panic, levels.panic] = doit(i ++, 'panic');
        [slog.alert, levels.alert] = doit(i ++, 'alert');
        [slog.crit, levels.crit] = doit(i ++, 'crit');
        [slog.error, levels.error] = doit(i ++, 'error');
        [slog.warn, levels.warn] = doit(i ++, 'warn');
        [slog.notice, levels.notice] = doit(i ++, 'notice');
        [slog.info, levels.info] = doit(i ++, 'info');
        [slog.debug, levels.debug] = doit(i ++, 'debug');
        [slog.trace, levels.trace] = doit(i ++, 'trace');
    }
    slog.LEVELS = levels;
    return harden(slog);
};

export default harden(makeSlog);
