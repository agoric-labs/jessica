type SlogContext = Map<string, any>;
type SlogContextObject = {[key: string]: any};
type SlogHandler = (level: number, names: SlogName[],
    levels: Map<SlogName, number>, context: SlogContext,
    template: TemplateStringsArray, args: any[]) => any;
type SlogSetMapFrom = (context: SlogContext, obj: SlogContextObject) => void;

const makeSlog = (handler: SlogHandler, setMapFrom: SlogSetMapFrom): Slog => {
    let levels = makeMap<SlogName, number>(), names: SlogName[] = [];
    let slog: Partial<Slog> & Function = () => {};
    for (const prep of [true, false]) {
        let i = 0, doit;
        if (prep) {
            // Just determine the levels.
            doit = (level: number, name: SlogName) => {
                names[level] = name;
                levels.set(name, level);
                return slog;
            };
        }
        else {
            // We have levels.trace, so create the actual SLOG object.
            doit = (level: number, _name: SlogName): SlogTag => {
                function tag(context: SlogContextObject): SlogTag;
                function tag(template: TemplateStringsArray, ...args: any[]): any;
                function tag(contextOrTemplate: SlogContextObject | TemplateStringsArray, ...args: any[]) {
                    const context = makeMap();
                    if (!contextOrTemplate.raw) {
                        setMapFrom(context, contextOrTemplate);
                        return (template: TemplateStringsArray, ...args: any[]) =>
                            handler(level, names, levels, context, template, args);
                    }
                    // No specified context, this is the template tag.
                    const template = contextOrTemplate as TemplateStringsArray;
                    return handler(level, names, levels, context, template, args);
                }
                return tag;
            };
            let defaultLevel = levels.get('trace');
            levels.set('DEFAULT', defaultLevel);
            slog = doit(defaultLevel, 'DEFAULT');
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
    return harden(slog as Slog);
};

export default harden(makeSlog);
