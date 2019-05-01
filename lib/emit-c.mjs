import { insulate } from '@agoric/jessie'; const emitMain = insulate((deps, _argv) => {
  deps.writeOutput('-', '/* FIXME: Stub */\n');
});

export default emitMain;