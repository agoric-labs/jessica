const tagString = (tag: (template: TemplateStringsArray, ...args: any[]) => any) => {
    function tagged(template: TemplateStringsArray, ...args: any[]) {
        const cooked = args.reduce((prior, hole, i) => {
            prior.push(String(hole), template[i + 1]);
            return prior;
        }, [template[0]]);
        const tmpl: string[] & {raw?: TemplateStringsArray['raw']} = [cooked.join('')];
        const raw = args.reduce((prior, hole, i) => {
            prior.push(String(hole), template.raw[i + 1]);
            return prior;
        }, [template.raw[0]]);
        tmpl.raw = [raw.join('')];
        return tag(tmpl as TemplateStringsArray);
    }
    return harden(tagged);
};

export default harden(tagString);
