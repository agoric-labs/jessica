// tessc.ts - The Tessie (Typescript-to-Jessie) Compiler.
// Michael FIG <michael+jessica@fig.org>, 2019-03-20

// TODO: Parse command line options for a tsconfig.json instead of using
// the one in the current directory.
// TODO: Also, use its include/exclude rules.

/// <reference path="node_modules/@types/node/ts3.1/index.d.ts"/>
// tslint:disable:no-console

import * as fs from 'fs';
import * as ts from 'typescript';

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

let linterErrors = 0;
let trustedSymbols = new Set<ts.Symbol>();
function resetState() {
  linterErrors = 0;
  trustedSymbols = new Set<ts.Symbol>();
}

const analyze: ts.TransformerFactory<ts.SourceFile> = (context) =>
  (rootNode) => {
    function buildTrust(node: ts.Node) {
      switch (node.kind) {
        // FIXME: Build trustedSymbols.
      }
      return node;
    }
    ts.visitEachChild(rootNode, buildTrust, context);
    return rootNode;
  };

const lint: ts.TransformerFactory<ts.SourceFile> = (context) =>
  (rootNode) => {
    function moduleLevel(node: ts.Node) {
      switch (node.kind) {
      case ts.SyntaxKind.VariableStatement: {
        const varStmt = node as ts.VariableStatement;
        const exported = varStmt.modifiers ?
          varStmt.modifiers.filter(mod => mod.kind === ts.SyntaxKind.ExportKeyword) :
          [];
        if (exported.length > 0) {
          report(node, `Module cannot contain named exports`);
        }
        const flags = ts.getCombinedNodeFlags(varStmt.declarationList);
        if (!(flags & ts.NodeFlags.Const)) {
          report(node, `Module-level declarations must be const`);
        }
        for (const decl of varStmt.declarationList.declarations) {
          if (decl.initializer) {
            ts.visitEachChild(decl.initializer, pureExpr, context);
          }
        }
        break;
      }

      case ts.SyntaxKind.ExportAssignment:
      case ts.SyntaxKind.NotEmittedStatement:
      case ts.SyntaxKind.TypeAliasDeclaration:
      case ts.SyntaxKind.InterfaceDeclaration:
      case ts.SyntaxKind.ImportDeclaration:
        // Safe Typescript declarations.
        break;

      default:
        report(node, `Unexpected module-level node ${ts.SyntaxKind[node.kind]}`);
      }
      return node;
    }

    function pureExpr(node: ts.Node) {
      switch (node.kind) {
      case ts.SyntaxKind.LiteralType:
      case ts.SyntaxKind.ArrowFunction:
      case ts.SyntaxKind.Identifier:
      case ts.SyntaxKind.MethodDeclaration:
        return node;

      case ts.SyntaxKind.CallExpression: {
        const callExpr = node as ts.CallExpression;
        const lhs = callExpr.expression;
        if (lhs.kind === ts.SyntaxKind.Identifier) {
          const id = lhs as ts.Identifier;
          if (id.text === 'immunize') {
            // An immunized pureExpr?
            for (const arg of callExpr.arguments) {
              pureExpr(arg);
            }
            return node;
          }
        }
        break;
      }

      case ts.SyntaxKind.PropertyAssignment: {
        const po = node as ts.PropertyAssignment;
        if (po.initializer) {
          pureExpr(po.initializer);
        }
        return node;
      }

      case ts.SyntaxKind.ObjectLiteralExpression: {
        const objExpr = node as ts.ObjectLiteralExpression;
        ts.visitEachChild(objExpr, pureExpr, context);
        return node;
      }

      case ts.SyntaxKind.SpreadAssignment: {
        const sa = node as ts.SpreadAssignment;
        pureExpr(sa.expression);
        return node;
      }
      }
      report(node, `${ts.SyntaxKind[node.kind]} is not pure`);
      return node;
    }

    function report(node: ts.Node, message: string) {
      // Add to our errors.
      linterErrors ++;

      let start: number;
      try {
        start = node.getStart();
      } catch (e) {
        // console.log(e, ts.SyntaxKind[node.kind], node);
        start = 0;
      }
      const {line, character} = rootNode.getLineAndCharacterOfPosition(start);
      console.log(
        `${rootNode.fileName}:${line + 1}:${character + 1}: Tessie: ${message}`
      );
    }

    ts.visitEachChild(rootNode, moduleLevel, context);
    return rootNode;
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

      // Immunize declarations.
      case ts.SyntaxKind.VariableStatement: {
        const varStmt = node as ts.VariableStatement;
        const decls = varStmt.declarationList.declarations.map(decl => {
          if (decl.initializer && ts.isLiteralExpression(decl.initializer)) {
            // Don't need to immunize literals.
            return decl;
          }
          const immunized = decl.initializer ? immunizeExpr(decl.initializer) : undefined;
          return setPos(decl, ts.createVariableDeclaration(decl.name, undefined, immunized));
        });

        const varList = setPos(varStmt.declarationList,
          ts.createVariableDeclarationList(decls, varStmt.declarationList.flags));
        setPos(varStmt.declarationList.declarations, varList.declarations);
        return setPos(node, ts.createVariableStatement(varStmt.modifiers, varList));
      }
      }
      return node;
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
  (rootNode) => {
    function bondifyNode(node: ts.Node) {
      switch (node.kind) {
      // FIXME: Insert calls to `bond`.
      }
      return node;
    }
    return ts.visitEachChild(rootNode, bondifyNode, context);
  };

const tessie2jessie: ts.CustomTransformers = {
  before: [analyze, immunize, bondify, lint],
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
    resetState();
    const writeFile: ts.WriteFileCallback = (fileName, data, writeBOM, onError, sourceFiles) => {
      if (linterErrors) {
        return;
      }
      const out = fileName.replace(/(\.mjs)\.js$/, '$1');
      const srcBase = sourceFiles[0].fileName.replace(/^.*\//, '');
      try {
        fs.writeFileSync(out, `\
// DO NOT EDIT - Generated automatically from ${srcBase} by tessc
${data}`);
      } catch (e) {
        onError(e);
      }
    };
    const emitResult = program.emit(src, writeFile, undefined, undefined, transformers);
    showDiagnostics(emitResult.diagnostics);
    if (emitResult.emitSkipped || linterErrors) {
      exitCode = 1;
    }
  }

  // console.log(`Process exiting with code '${exitCode}'.`);
  process.exit(exitCode);
}
