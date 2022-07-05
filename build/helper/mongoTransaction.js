"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoTransaction = void 0;
/* eslint require-await: off */
const mongoose_1 = require("mongoose");
async function mongoTransaction(fn) {
    return mongoose_1.connection.transaction(fn);
}
exports.mongoTransaction = mongoTransaction;
