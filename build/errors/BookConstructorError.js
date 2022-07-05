"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookConstructorError = void 0;
const MediciError_1 = require("./MediciError");
class BookConstructorError extends MediciError_1.MediciError {
    constructor(message, code = 400) {
        super(message);
        this.code = 400;
        this.code = code;
    }
}
exports.BookConstructorError = BookConstructorError;
