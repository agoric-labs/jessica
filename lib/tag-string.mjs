const tagString = (tag) => {
    function tagged(template, ...args) {
        const cooked = args.reduce((prior, hole, i) => {
            prior.push(String(hole), template[i + 1]);
            return prior;
        }, [template[0]]);
        const tmpl = [cooked.join('')];
        const raw = args.reduce((prior, hole, i) => {
            prior.push(String(hole), template.raw[i + 1]);
            return prior;
        }, [template.raw[0]]);
        tmpl.raw = [raw.join('')];
        return tag(tmpl);
    }
    return harden(tagged);
};
export default harden(tagString);
//# sourceMappingURL=tag-string.mjs.js.map