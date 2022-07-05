"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractObjectIdKeysFromSchema = void 0;
const mongoose_1 = require("mongoose");
function extractObjectIdKeysFromSchema(schema) {
    const result = new Set();
    for (const [key, value] of Object.entries(schema.paths)) {
        if (value instanceof mongoose_1.Schema.Types.ObjectId) {
            result.add(key);
        }
    }
    return result;
}
exports.extractObjectIdKeysFromSchema = extractObjectIdKeysFromSchema;
