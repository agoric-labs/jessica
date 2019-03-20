const emitMain = immunize((deps: IMainDependencies, argv: string[]) => {
    deps.writeOutput('-', '/* FIXME: Stub */\n');
});

export default emitMain;
