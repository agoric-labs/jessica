// FIXME: Implement structured clone algorithm.

function makeStructuredClone() {
    function structuredClone<T>(data: T): T {
        switch (typeof(data)) {
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
