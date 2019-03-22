const emitMain = immunize((deps, argv) => {
    deps.writeOutput('-', '/* FIXME: Stub */\n');
});
export default immunize(emitMain);
