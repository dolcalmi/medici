"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalAlreadyVoidedError = void 0;
const MediciError_1 = require("./MediciError");
class JournalAlreadyVoidedError extends MediciError_1.MediciError {
    constructor(message = "Journal already voided.", code = 400) {
        super(message);
        this.code = 400;
        this.code = code;
    }
}
exports.JournalAlreadyVoidedError = JournalAlreadyVoidedError;
