// tessc.ts - The Tessie (Typescript-to-Jessie) Compiler.
// Michael FIG <michael+jessica@fig.org>, 2019-03-20

/// <reference path="node_modules/@types/node/ts3.1/index.d.ts"/>
// tslint:disable:no-console

import * as fs from 'fs';
import * as ts from 'typescript';
import * as util from 'util';

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
interface IPositionable {
  pos: number;
  end: number;
}

function setPos<T extends IPositionable>(src: IPositionable, dst: T): T {
  dst.pos = src.pos;
  dst.end = src.end;
  const parent = (src as any).parent;
  if (parent) {
    (dst as any).parent = parent;
  }
  // console.log(`got ${util.inspect(dst)}`);
  return dst;
}

const lint: ts.TransformerFactory<ts.SourceFile> = (context) =>
  (topNode) => {
    function moduleLevel(node: ts.Node) {
      switch (node.kind) {
      case ts.SyntaxKind.VariableStatement: {
        const varStmt = node as ts.VariableStatement;
        // tslint:disable:no-bitwise
        if (!(varStmt.declarationList.flags & ts.NodeFlags.Const)) {
          report(node, `Module-level declarations must be const`);
        }
        break;
      }

      case ts.SyntaxKind.NotEmittedStatement:
      case ts.SyntaxKind.ExportAssignment:
      case ts.SyntaxKind.ImportDeclaration:
        break;

      default:
        report(node, `Unexpected module-level expression ${ts.SyntaxKind[node.kind]}`);
      }
      return node;
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

    function report(node: ts.Node, message: string) {
      let start: number;
      try {
        start = node.getStart();
      } catch (e) {
        // console.log(e, ts.SyntaxKind[node.kind], node);
        start = 0;
      }
      const {line, character} = topNode.getLineAndCharacterOfPosition(start);
      console.log(
        `${topNode.fileName}: ${line + 1}:${character + 1}: ${message}`
      );
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
        // Handle `export` statements.
        const exportAssign = node as ts.ExportAssignment;
        const immunized = immunizeExpr(exportAssign.expression);
        return setPos(node, ts.createExportDefault(immunized));
      }

      // Handle `const` statements.
      case ts.SyntaxKind.VariableStatement: {
        const varStmt = node as ts.VariableStatement;
        const decls = varStmt.declarationList.declarations.map(decl => {
          const immunized = decl.initializer ? immunizeExpr(decl.initializer) : undefined;
          return setPos(decl, ts.createVariableDeclaration(decl.name, undefined, immunized));
        });
        const varList = setPos(varStmt.declarationList,
          ts.createVariableDeclarationList(decls, ts.NodeFlags.Const));
        setPos(varStmt.declarationList.declarations, varList.declarations);
        return setPos(node, ts.createVariableStatement(varStmt.modifiers, varList));
      }

      default:
        return node;
      }
    }

    function immunizeExpr(expr: ts.Expression) {
      if (expr.kind === ts.SyntaxKind.CallExpression) {
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
  after: [lint],
  before: [immunize, bondify],
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
