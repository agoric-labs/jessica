function bootPeg(makePeg, handParsedPeg) {
    function metaCompile(defs) {
        throw `Would metacompile ${JSON.stringify(defs)}`;
    }
    
    function pegTag(template, ...args) {
        // TODO: Implement.
        return (t, ...as) => as.reduce((prior, _a, i) => {
            prior.push(i, t[i + 1]);
            return prior;
        }, [t[0]]);
    }

    // Allow our grammars to be extended.
    pegTag.extends = (subTag) => {
        // TODO: Extend the subtag.
        return pegTag;
    };

    // These primitives are needed by our subgrammars.
    pegTag.ACCEPT = (parser, input) => { throw `Would accept!`; };
    pegTag.FAIL = (parser, input) => { throw `Would fail!`; };
    pegTag.HOLE = (parser, input) => { throw `Would match hole!`;};
    return harden({bootPegTag: pegTag, metaCompile});
}

export default harden(bootPeg);
