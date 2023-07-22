// @jessie-check
const makeCounter = harden(() => {
    let count = 0;
    return harden({
        incr: () => (count += 1),
        decr: () => (count -= 1)
    });
});
