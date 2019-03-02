const tagString = (tag: (template: TemplateStringsArray, ...args: any[]) => any, uri?: string) => {
    function tagged(template: TemplateStringsArray, ...args: any[]) {
        slog.error`${JSON.stringify(args)}`;
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
        slog.error`${JSON.stringify(tmpl)}`;
        return tag(tmpl as TemplateStringsArray);
    }
    return harden(tagged);
};

export default harden(tagString);
