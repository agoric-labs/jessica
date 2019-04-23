const t = require('@babel/types');

module.exports = () => {
    const topLevelDecls = new WeakSet();
    const insulateFunction = 'insulate';
    const importPrefix = '$i_';
    const safeModules = ['@agoric/jessie'];
    const isSafeModule = (moduleName) => {
        return safeModules.indexOf(moduleName) >= 0;
    };
    const insulateExpr = (expr) => {
        if (expr.type === 'CallExpression' &&
            expr.callee.type === 'Identifier' &&
            expr.callee.name === insulateFunction) {
            // Already insulated.
            return expr;
        }
    
        switch (expr.type) {
            case 'NumericLiteral':
            case 'StringLiteral':
            case 'BooleanLiteral':
                // Don't need to insulate.
                return expr;
            case 'Identifier':
                if (!expr.name.startsWith(importPrefix)) {
                    return expr;
                }
                break;
        }
        // Pass it to insulate.
        return t.callExpression(t.identifier(insulateFunction), [expr]);
    };
    
    const makeSafeImport = (local) => {
        if (local.type === 'Identifier' &&
            local.name.startsWith(importPrefix)) {
            return undefined;
        }
        const safeName = local.name;
        local.name = importPrefix + safeName;
        return [t.variableDeclaration('const',
            [t.variableDeclarator(t.identifier(safeName), insulateExpr(local))])];
    };

    return {
        visitor: {
            ExportDefaultDeclaration(path) {
                path.node.declaration = insulateExpr(path.node.declaration);
            },
            ImportNamespaceSpecifier(path) {
                if (!isSafeModule(path.parentPath.node.source.value)) {
                    path.parentPath.insertAfter(makeSafeImport(path.node.local));
                }
            },
            ImportDefaultSpecifier(path) {
                if (!isSafeModule(path.parentPath.node.source.value)) {
                    path.parentPath.insertAfter(makeSafeImport(path.node.local));
                }
            },
            ImportSpecifier(path) {
                if (!isSafeModule(path.parentPath.node.source.value)) {
                    path.parentPath.insertAfter(makeSafeImport(path.node.local));
                }
            },
            VariableDeclaration(path) {
                if (path.parent.type !== 'Program' &&
                    path.parent.type !== 'ExportNamedDeclaration') {
                    return;
                }
                if (path.node.kind !== 'const') {
                    throw path.buildCodeFrameError(`Module-level declaration must be "const"`);
                }
                topLevelDecls.add(path.node);
            },
            VariableDeclarator(path) {
                if (!topLevelDecls.has(path.parent)) {
                    return;
                }
                if (path.node.init) {
                    path.node.init = insulateExpr(path.node.init);
                }
            },
        },
    };
};
