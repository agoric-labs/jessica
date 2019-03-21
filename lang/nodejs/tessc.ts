// tessc.ts - The Tessie (Typescript-to-Jessie) Compiler.
// Michael FIG <michael+jessica@fig.org>, 2019-03-20

/// <reference path="node_modules/@types/node/ts3.1/index.d.ts"/>
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

const analyze: ts.TransformerFactory<ts.SourceFile> = (context) =>
  (topNode) => {
    function moduleLevel(node: ts.Node) {
      switch (node.kind) {
      // FIXME: Restrict the allowed module expressions.
      default:
        return node;
      }
    }

    function pureExpr(node: ts.Node) {
      switch (node.kind) {
        // FIXME: Restrict the allowed pure expressions.
      default:
        return node;
      }
    }

    function otherExpr(node: ts.Node) {
      switch (node.kind) {
        // FIXME: Build trust graph for bondify to use.
      default:
        return node;
      }
    }
    ts.forEachChild(topNode, moduleLevel);
    return topNode;
  };

const immunize: ts.TransformerFactory<ts.SourceFile> = (context) =>
  (rootNode) => {
    function moduleRoot(node: ts.Node) {
      return ts.visitEachChild(node, moduleStatement, context);
    }
    function moduleStatement(node: ts.Node) {
      switch (node.kind) {
      case ts.SyntaxKind.ExportAssignment: {
        const exportAssign = node as ts.ExportAssignment;
        const immunized = immunizeExpr(exportAssign.expression);
        if (!exportAssign.name) {
          return ts.createExportDefault(immunized);
        }
        return ts.createExportAssignment(exportAssign.decorators, exportAssign.modifiers,
          exportAssign.isExportEquals, immunized);
      }

      // FIXME: Handle `const` statements.

      default:
        return node;
      }
    }

    function immunizeExpr(expr: ts.Expression) {
      switch (expr.kind) {
      case ts.SyntaxKind.CallExpression: {
        // May already be immunized.
        const callExpr = expr as ts.CallExpression;
        const lhs = callExpr.expression;
        if (lhs.kind === ts.SyntaxKind.Identifier) {
          const id = lhs as ts.Identifier;
          if (id.text === 'immunize') {
            // Already immunized.
            return expr;
          }
        }
        break;
      }
      }

      return ts.createCall(ts.createIdentifier('immunize'), undefined, [expr]);
    }

    return ts.visitNode(rootNode, moduleRoot);
  };

const bondify: ts.TransformerFactory<ts.SourceFile> = (context) =>
  (topNode) => {
    function bondifyNode(node: ts.Node) {
      switch (node.kind) {
      // FIXME: Insert calls to `bond`.
      default:
        return node;
      }
    }
    ts.forEachChild(topNode, bondifyNode);
    return topNode;
  };

const tessie2jessie: ts.CustomTransformers = {
  after: [analyze, immunize, bondify],
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
