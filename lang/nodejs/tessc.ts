// tessc.ts - The Tessie (Typescript-to-Jessie) Compiler.
// Michael FIG <michael+jessica@fig.org>, 2019-03-20

// tslint:disable:no-console

import * as fs from 'fs';
import * as ts from "typescript";

// TODO: Don't hardcode this path, take it from a command-line option.
const TSCONFIG_JSON = './tsconfig.json';
const tsConfigJSON = fs.readFileSync(TSCONFIG_JSON, {encoding: 'utf-8'});
const tsConfig = JSON.parse(tsConfigJSON);

const co = tsConfig.compilerOptions;
if (co.target !== 'jessie') {
  console.log(`Tessie only knows how to compile target: "jessie", not ${co.target}`);
  process.exit(1);
}
// Set the target to something Typescript understands.
co.target = 'esnext';

const {errors, options: opts} = ts.convertCompilerOptionsFromJson(co, ".", TSCONFIG_JSON);
showDiagnostics(errors);
if (errors.length) {
  process.exit(1);
}

const bondifySourceFile: ts.TransformerFactory<ts.SourceFile> = (context) =>
  (node) => {
    // FIXME: first pass, find all the trusted function arguments.
    // FIXME: second pass, insert the required bonds.
    // console.log('have', node);
    return node;
  };

const tessie2jessie: ts.CustomTransformers = {
  after: [bondifySourceFile],
};

compile(process.argv.slice(2), opts, tessie2jessie);
function showDiagnostics(errs: ReadonlyArray<ts.Diagnostic>) {
  errs.forEach(diagnostic => {
    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start!
      );
      const message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n"
      );
      console.log(
        `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
      );
    } else {
      console.log(
        `${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`
      );
    }
  });
}

function compile(fileNames: string[], options: ts.CompilerOptions,
                 transformers: ts.CustomTransformers): void {
  const program = ts.createProgram(fileNames, options);
  showDiagnostics(ts.getPreEmitDiagnostics(program));

  // Emit *.mjs.ts directly to *.mjs.
  let exitCode = 0;
  for (const src of program.getSourceFiles()) {
    const writeFile: ts.WriteFileCallback = (fileName, data, writeBOM, onError, sourceFiles) => {
      const out = fileName.replace(/(\.mjs)\.js$/, '$1');
      try {
        fs.writeFileSync(out, data);
      } catch (e) {
        onError(e);
      }
    };
    const emitResult = program.emit(src, writeFile, undefined, undefined, transformers);
    showDiagnostics(emitResult.diagnostics);
    if (emitResult.emitSkipped) {
      exitCode = 1;
    }
  }

  // console.log(`Process exiting with code '${exitCode}'.`);
  process.exit(exitCode);
}
