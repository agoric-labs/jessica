const makeSlog = (handler) => {
    const levels = makeMap();
    const names = [];
    const slogTags = {};
    const slogTagsR = {};
    const slogTagsN = {};
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
        if (!prep) {
            const defaultLevel = levels.get('trace');
            levels.set('DEFAULT', defaultLevel);
        }
        // Can't use Object.assign because we depend on evaluation order.
        slogTagsN.panic = doit(i++, 'panic');
        slogTagsN.alert = doit(i++, 'alert');
        slogTagsN.crit = doit(i++, 'crit');
        slogTagsN.error = doit(i++, 'error');
        slogTagsR.reject = doit(i++, 'reject');
        slogTags.warn = doit(i++, 'warn');
        slogTags.notice = doit(i++, 'notice');
        slogTags.info = doit(i++, 'info');
        slogTags.debug = doit(i++, 'debug');
        slogTags.trace = doit(i++, 'trace');
    }
    const slog = slogTags;
    const slogR = slogTagsR;
    const slogN = slogTagsN;
    return harden(Object.assign(slog.trace, slog, slogR, slogN, { LEVELS: levels, NAMES: names }));
};
export default harden(makeSlog);
