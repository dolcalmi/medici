"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidAccountPathLengthError = void 0;
const MediciError_1 = require("./MediciError");
class InvalidAccountPathLengthError extends MediciError_1.MediciError {
    constructor(message, code = 400) {
        super(message);
        this.code = 400;
        this.code = code;
    }
}
exports.InvalidAccountPathLengthError = InvalidAccountPathLengthError;
