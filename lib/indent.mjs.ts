const indent = (template: TemplateStringsArray, ...substs: any[]) => {
    const result = [];
    let newnewline = '\n';
    for (let i = 0, ilen = substs.length; i < ilen; i++) {
        let segment = template[i];
        if (i === 0 && segment[0].startsWith('\n')) {
            segment = segment.slice(1);
        }
        const lastnl = segment.lastIndexOf('\n');
        if (lastnl >= 0) {
            newnewline = '\n';
            for (let j = segment.length - lastnl; j > 0; j --) {
                newnewline += ' ';
            }
        }
        result.push(segment);
        // We don't have regexps at our disposal in Jessie.
        String(substs[i]).split('\n').forEach((subst, j) => {
            if (j !== 0) {
                result.push(newnewline);
            }
            result.push(subst);
        });
    }
    result.push(template[substs.length]);
    return result.join('');
};

export default indent;
