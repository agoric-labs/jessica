const tagString = <T =  any, U extends string = string>(tag: IPegParserTag<T, U>, uri?: string) => {
    function tagged(config: U): IPegParserTag<T, U>;
    function tagged(template: TemplateStringsArray, ...args: any[]): T;
    function tagged(templateOrConfig: U | TemplateStringsArray, ...args: any[]):
        T | IPegParserTag<T, U> {
        if (typeof templateOrConfig === 'string') {
            return tag(templateOrConfig);
        }
        const template = templateOrConfig;
        const cooked = template.reduce<string[]>((prior, t, i) => {
            prior.push(t, String(args[i]));
            return prior;
        }, []);
        cooked.push(template[template.length - 1]);
        const tmpl: string[] & {
            raw?: TemplateStringsArray['raw'];
            sources?: SourceLocation[];
        } = [cooked.join('')];
        const raw = args.reduce((prior, hole, i) => {
            prior.push(String(hole), template.raw[i + 1]);
            return prior;
        }, [template.raw[0]]).join('');
        tmpl.raw = [raw];
        tmpl.sources = [{
            byte: 0,
            column: 1,
            line: 1,
            uri,
        }];
        return tag(tmpl as TemplateStringsArray);
    }
    return harden(tagged);
};

export default harden(tagString);
