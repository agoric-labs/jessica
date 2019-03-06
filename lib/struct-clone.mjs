// FIXME: Implement structured clone algorithm.
function makeStructuredClone(ents) {
    function structuredClone(data) {
        switch (typeof (data)) {
            case 'string':
            case 'number':
            case 'undefined':
                return data;
            case 'object':
                // FIXME: Finish
                return data;
            default:
                throw makeError(`Cannot clone ${data}`);
        }
    }
    return harden(structuredClone);
}
export default harden(makeStructuredClone);
