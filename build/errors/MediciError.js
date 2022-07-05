"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediciError = void 0;
class MediciError extends Error {
    constructor(message, code = 500) {
        super(message);
        this.code = 500;
        this.code = code;
    }
}
exports.MediciError = MediciError;
