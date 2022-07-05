"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalNotFoundError = void 0;
const MediciError_1 = require("./MediciError");
class JournalNotFoundError extends MediciError_1.MediciError {
    constructor(message = "Journal could not be found.", code = 403) {
        super(message);
        this.code = 404;
        this.code = code;
    }
}
exports.JournalNotFoundError = JournalNotFoundError;
