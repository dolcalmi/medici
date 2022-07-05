"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenObject = void 0;
function flattenObject(obj, parent, deep = false, res = {}) {
    if (!obj)
        return {};
    for (const [key, value] of Object.entries(obj)) {
        const propName = parent ? parent + "." + key : key;
        if (deep && typeof obj[key] === "object") {
            flattenObject(value, propName, deep, res);
        }
        else {
            res[propName] = value;
        }
    }
    return res;
}
exports.flattenObject = flattenObject;
