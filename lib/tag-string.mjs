const tagString = (tag, uri) => {
    function tagged(template, ...args) {
        slog.error `${JSON.stringify(args)}`;
        const cooked = template.reduce((prior, t, i) => {
            prior.push(t, String(args[i]));
            return prior;
        }, []);
        cooked.push(template[template.length - 1]);
        const tmpl = [cooked.join('')];
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
        slog.error `${JSON.stringify(tmpl)}`;
        return tag(tmpl);
    }
    return harden(tagged);
};
export default harden(tagString);
//# sourceMappingURL=tag-string.mjs.js.map