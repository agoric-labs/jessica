"use strict";
// tse.ts - The Tessie (Typescript-to-Jessie) compiler.
// Michael FIG <michael+jessica@fig.org>, 2019-03-20
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="node_modules/@types/node/ts3.1/index.d.ts"/>
// tslint:disable:no-console
const ts = require("typescript");
function showDiagnostics(errs) {
    errs.forEach(diagnostic => {
        if (diagnostic.file) {
            const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        }
        else {
            console.log(`${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`);
        }
    });
}
function compile(fileNames, options) {
    const program = ts.createProgram(fileNames, options);
    const emitResult = program.emit();
    const allDiagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);
    showDiagnostics(allDiagnostics);
    const exitCode = emitResult.emitSkipped ? 1 : 0;
    // console.log(`Process exiting with code '${exitCode}'.`);
    process.exit(exitCode);
}
const fs = require("fs");
const TSCONFIG_JSON = './tsconfig.json';
const tsConfigJSON = fs.readFileSync(TSCONFIG_JSON, { encoding: 'utf-8' });
const tsConfig = JSON.parse(tsConfigJSON);
const co = tsConfig.compilerOptions;
if (co.target !== 'jessie') {
    console.log(`Tessie only knows how to compile target: "jessie", not ${co.target}`);
    process.exit(1);
}
// Set the target to something Typescript understands.
co.target = 'esnext';
const { errors, options: opts } = ts.convertCompilerOptionsFromJson(co, ".", TSCONFIG_JSON);
showDiagnostics(errors);
if (errors.length) {
    process.exit(1);
}
compile(process.argv.slice(2), opts);
