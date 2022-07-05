"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPrototypeAttribute = void 0;
const reservedWords = new Set([
    "__proto__",
    "__defineGetter__",
    "__lookupGetter__",
    "__defineSetter__",
    "__lookupSetter__",
    "constructor",
    "hasOwnProperty",
    "isPrototypeOf",
    "propertyIsEnumerable",
    "toString",
    "toLocaleString",
    "valueOf",
]);
/**
 * Check if a key is a reserved word to avoid any prototype-pollution.
 */
function isPrototypeAttribute(value) {
    return reservedWords.has(value);
}
exports.isPrototypeAttribute = isPrototypeAttribute;
