const t = require('@babel/types');

module.exports = () => {
    const topLevelDecls = new WeakSet();
    const immuneFunction = 'immunize';
    const importPrefix = '$i_';
    const immunizeExpr = (expr) => {
        if (expr.type === 'CallExpression' &&
            expr.callee.type === 'Identifier' &&
            expr.callee.name === immuneFunction) {
            // Already immunized.
            return expr;
        }
    
        switch (expr.type) {
            case 'NumericLiteral':
            case 'StringLiteral':
            case 'BooleanLiteral':
                // Don't need to immunize.
                return expr;
        }
        // Pass it to immunize.
        return t.callExpression(t.identifier(immuneFunction), [expr]);
    };
    
    const makeSafeImport = (local) => {
        if (local.type === 'Identifier' &&
            local.name.startsWith(importPrefix)) {
            return undefined;
        }
        const safeName = local.name;
        local.name = importPrefix + safeName;
        return [t.variableDeclaration('const',
            [t.variableDeclarator(t.identifier(safeName), immunizeExpr(local))])];
    };

    return {
        visitor: {
            ExportDefaultDeclaration(path) {
                path.node.declaration = immunizeExpr(path.node.declaration);
            },
            ImportNamespaceSpecifier(path) {
                path.parentPath.insertAfter(makeSafeImport(path.node.local));
            },
            ImportDefaultSpecifier(path) {
                path.parentPath.insertAfter(makeSafeImport(path.node.local));
            },
            ImportSpecifier(path) {
                path.parentPath.insertAfter(makeSafeImport(path.node.local));
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
                    path.node.init = immunizeExpr(path.node.init);
                }
            },
        },
    };
};
