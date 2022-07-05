"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeSetKeyToMetaObject = void 0;
const transaction_1 = require("../models/transaction");
const isPrototypeAttribute_1 = require("./isPrototypeAttribute");
function safeSetKeyToMetaObject(key, val, meta) {
    if ((0, isPrototypeAttribute_1.isPrototypeAttribute)(key))
        return;
    if (!(0, transaction_1.isValidTransactionKey)(key, transaction_1.defaultTransactionSchemaKeys))
        meta[key] = val;
}
exports.safeSetKeyToMetaObject = safeSetKeyToMetaObject;
