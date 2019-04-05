type SlogContext = Map<string, any>;
type SlogHandler =
    (level: number, names: SlogName[],
     levels: Map<SlogName, number>, context: SlogContext,
     template: TemplateStringsArray, args: any[]) => any;

export const contextArg = (context: Map<string, any>, a: any) => {
    if (typeof a !== 'object' || a === null) {
        // Just stringify the argument.
        return '' + a;
    } else if (a.length !== undefined) {
        // Take the value as the (anonymous) array.
        return a;
    }
    // Deconstruct the argument object.
    let valname: string, val: any;
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
            slog.error`Context value ${{valname}} mismatch: ${{val}} vs. ${{oval}}`;
        }
    } else {
        context.set(valname, val);
    }
    return val;
};

const makeSlog = (handler: SlogHandler): Slog => {
    const levels = makeMap<SlogName, number>();
    const names: SlogName[] = [];
    const doit = <T>(level: number, name: SlogName): SlogTag<T> => {
        if (level >= 0) {
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
            return handler(level, names, levels, context, template, args);
        }
        return tag;
    };

    let i = 0;
    const slog: Partial<Slog> & SlogTag<string> = doit<string>(-1, 'stringify');
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
    return slog as Slog;
};

export default makeSlog;
