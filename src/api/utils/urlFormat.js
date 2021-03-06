"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileRouteUrlFormater = void 0;
var TokenType;
(function (TokenType) {
    TokenType["String"] = "String";
    TokenType["Variable"] = "Variable";
})(TokenType || (TokenType = {}));
/**
 * Compile a route URL formater with syntax `/path/:var1/:var2`.
 * Returns a function that expects an object `{var1: 1, var2: 2}`, and returns`/path/1/2`.
 *
 * It's cheap enough to be neglibible. For the sample input below it costs:
 * - compile: 1010 ns / op
 * - execute: 105 ns / op
 * - execute with template literal: 12 ns / op
 * @param path `/eth/v1/validator/:name/attester/:epoch`
 */
function compileRouteUrlFormater(path) {
    const tokens = [];
    for (let i = 0, len = path.length; i < len; i++) {
        const currentToken = tokens[tokens.length - 1];
        switch (path[i]) {
            case ":": {
                if (currentToken !== undefined && currentToken.type === TokenType.Variable) {
                    throw Error(`Invalid path token ':' not closed: ${path}`);
                }
                tokens.push({ type: TokenType.Variable, start: i });
                break;
            }
            case "/": {
                if (currentToken === undefined || currentToken.type === TokenType.Variable) {
                    tokens.push({ type: TokenType.String, start: i });
                }
                break;
            }
            default: {
                if (currentToken === undefined) {
                    tokens.push({ type: TokenType.String, start: i });
                }
            }
        }
    }
    // Return a faster function if there's not ':' token
    if (tokens.length === 1 && tokens[0].type === TokenType.String) {
        return () => path;
    }
    const fns = tokens.map((token, i) => {
        const ending = tokens[i + 1] !== undefined ? tokens[i + 1].start : path.length;
        const part = path.slice(token.start, ending);
        switch (token.type) {
            case TokenType.String:
                return () => part;
            case TokenType.Variable: {
                const argKey = part.slice(1); // remove prepended ":"
                return (args) => args[argKey];
            }
        }
    });
    return function urlFormater(args) {
        // Don't use .map() or .join(), it's x3 slower
        let s = "";
        for (const fn of fns)
            s += fn(args);
        return s;
    };
}
exports.compileRouteUrlFormater = compileRouteUrlFormater;
//# sourceMappingURL=urlFormat.js.map