type SlogContext = Map<string, any>;
type SlogHandler =
    <T>(level: number, names: SlogName[],
        levels: Map<SlogName, number>, context: SlogContext,
        template: TemplateStringsArray, args: any[]) => any;

const makeSlog = (handler: SlogHandler): Slog => {
    const levels = makeMap<SlogName, number>();
    const names: SlogName[] = [];
    const slogTags: Record<string, SlogTag<string>> = {};
    const slogTagsR: Record<string, SlogTag<Promise<never>>> = {};
    const slogTagsN: Record<string, SlogTag<never>> = {};
    for (const prep of [true, false]) {
        let i = 0;
        const doit = <T>(level: number, name: SlogName): SlogTag<T> => {
            if (prep) {
                names[level] = name;
                levels.set(name, level);
            }
            function tag(context: Record<string, any>): SlogTag<T>;
            function tag(template: TemplateStringsArray, ...args: any[]): T;
            function tag(contextOrTemplate: Record<string, any> | TemplateStringsArray, ...args: any[]) {
                let context: Map<string, any>;
                if (!contextOrTemplate.raw) {
                    context = makeMap([...Object.entries(contextOrTemplate)]);
                    return (t: TemplateStringsArray, ...a: any[]) =>
                        handler(level, names, levels, context, t, a);
                }
                // No specified context, this is the template tag.
                context = makeMap<string, any>();
                const template = contextOrTemplate as TemplateStringsArray;
                return handler<T>(level, names, levels, context, template, args);
            }
            return tag;
        };

        if (!prep) {
            const defaultLevel = levels.get('trace');
            levels.set('DEFAULT', defaultLevel);
        }

        // Can't use Object.assign because we depend on evaluation order.
        slogTagsN.panic = doit<never>(i ++, 'panic');
        slogTagsN.alert = doit<never>(i ++, 'alert');
        slogTagsN.crit = doit<never>(i ++, 'crit');
        slogTagsN.error = doit<never>(i ++, 'error');
        slogTagsR.reject = doit<Promise<never>>(i ++, 'reject');
        slogTags.warn = doit<string>(i ++, 'warn');
        slogTags.notice = doit<string>(i ++, 'notice');
        slogTags.info = doit<string>(i ++, 'info');
        slogTags.debug = doit<string>(i ++, 'debug');
        slogTags.trace = doit<string>(i ++, 'trace');
    }
    const slog = slogTags as Record<SlogName, SlogTag<string>>;
    const slogR = slogTagsR as Record<SlogName, SlogTag<Promise<never>>>;
    const slogN = slogTagsN as Record<SlogName, SlogTag<never>>;
    return harden(Object.assign(slog.trace, slog, slogR, slogN, {LEVELS: levels, NAMES: names}));
};

export default harden(makeSlog);
