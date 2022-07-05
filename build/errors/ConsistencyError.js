"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsistencyError = void 0;
const MediciError_1 = require("./MediciError");
class ConsistencyError extends MediciError_1.MediciError {
    constructor(message = "medici ledge consistency harmed", code = 400) {
        super(message);
        this.code = 400;
        this.code = code;
    }
}
exports.ConsistencyError = ConsistencyError;
