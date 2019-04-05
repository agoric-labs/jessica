import jessieDefaults from '../nodejs/jessieDefaults.mjs';

(function(global) {
Object.keys(jessieDefaults).forEach(vname => {
    global[vname] = jessieDefaults[vname];
});
}(typeof window === 'undefined' ? global : window));

export default jessieDefaults;
