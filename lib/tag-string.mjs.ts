const tagString = <T>(tag: IParserTag<T>, uri?: string) => {
    function tagged(flag: string): IParserTag<T>;
    function tagged(template: TemplateStringsArray, ...args: any[]): T;
    function tagged(templateOrFlag: string | TemplateStringsArray, ...args: any[]):
        T | IParserTag<T> {
        if (typeof templateOrFlag === 'string') {
            return tag(templateOrFlag);
        }
        const template = templateOrFlag;
        const cooked = template.reduce<string[]>((prior, t, i) => {
            prior.push(t, String(args[i]));
            return prior;
        }, []);
        cooked.push(template[template.length - 1]);
        const cooked0 = cooked.join('');
        const raw0 = args.reduce((prior, hole, i) => {
            prior.push(String(hole), template.raw[i + 1]);
            return prior;
        }, [template.raw[0]]).join('');
        const sources0 = {
            byte: 0,
            column: 1,
            line: 1,
            uri,
        };
        const tmpl: any = [cooked0];
        tmpl.raw = [raw0];
        tmpl.sources = [sources0];
        return tag(tmpl as TemplateStringsArray);
    }
    return harden(tagged);
};

export default harden(tagString);
