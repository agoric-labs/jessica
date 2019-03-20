type SlogContext = Map<string, any>;
type SlogHandler =
    <T>(level: number, names: SlogName[],
        levels: Map<SlogName, number>, context: SlogContext,
        template: TemplateStringsArray, args: any[]) => any;

const makeSlog = immunize((handler: SlogHandler): Slog => {
    const levels = makeMap<SlogName, number>();
    const names: SlogName[] = [];
    let slog: Partial<Slog> & SlogTag<string>;
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

        if (prep) {
            slog = doit<string>(-1, 'DEFAULT');
        } else {
            const defaultLevel = levels.get('trace');
            levels.set('DEFAULT', defaultLevel);
            slog = slog.trace;
        }

        slog.panic = doit<never>(i ++, 'panic');
        slog.alert = doit<never>(i ++, 'alert');
        slog.crit = doit<never>(i ++, 'crit');
        slog.error = doit<never>(i ++, 'error');
        slog.reject = doit<Promise<never>>(i ++, 'reject');
        slog.warn = doit<string>(i ++, 'warn');
        slog.notice = doit<string>(i ++, 'notice');
        slog.info = doit<string>(i ++, 'info');
        slog.debug = doit<string>(i ++, 'debug');
        slog.trace = doit<string>(i ++, 'trace');
    }
    return slog as Slog;
});

export default makeSlog;
