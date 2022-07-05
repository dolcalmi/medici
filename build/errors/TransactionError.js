"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionError = void 0;
const MediciError_1 = require("./MediciError");
class TransactionError extends MediciError_1.MediciError {
    constructor(message, total, code = 400) {
        super(message);
        this.code = 400;
        this.total = total;
        this.code = code;
    }
}
exports.TransactionError = TransactionError;
