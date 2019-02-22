// Options: --free-variable-checker --require --validate
/*global module require*/

function indent(template, ...substs) {
    const result = [];
    let newnewline = '\n';
    for (let i = 0, ilen = substs.length; i < ilen; i++) {
        let segment = template[i];
        if (i == 0 && segment[0].startsWith('\n')) {
            segment = segment.substr(1);
        }
        const lastnl = segment.lastIndexOf('\n');
        if (lastnl >= 0) {
            newnewline = '\n';
            for (let i = segment.length - lastnl; i > 0; i --) {
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
}

export default harden(indent);
