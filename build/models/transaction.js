"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setTransactionSchema = exports.isTransactionObjectIdKey = exports.isValidTransactionKey = exports.defaultTransactionSchemaKeys = exports.transactionModel = exports.transactionSchema = void 0;
const mongoose_1 = require("mongoose");
const extractObjectIdKeysFromSchema_1 = require("../helper/extractObjectIdKeysFromSchema");
exports.transactionSchema = new mongoose_1.Schema({
    credit: Number,
    debit: Number,
    meta: mongoose_1.Schema.Types.Mixed,
    datetime: Date,
    account_path: [String],
    accounts: String,
    book: String,
    memo: String,
    _journal: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Medici_Journal",
    },
    timestamp: Date,
    voided: Boolean,
    void_reason: String,
    // The journal that this is voiding, if any
    _original_journal: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Medici_Journal",
    },
}, { id: false, versionKey: false, timestamps: false });
exports.defaultTransactionSchemaKeys = new Set(Object.keys(exports.transactionSchema.paths));
let transactionSchemaKeys = exports.defaultTransactionSchemaKeys;
function isValidTransactionKey(value, schemaKeys = transactionSchemaKeys) {
    return typeof value === "string" && schemaKeys.has(value);
}
exports.isValidTransactionKey = isValidTransactionKey;
let transactionSchemaObjectIdKeys = (0, extractObjectIdKeysFromSchema_1.extractObjectIdKeysFromSchema)(exports.transactionSchema);
function isTransactionObjectIdKey(value) {
    return typeof value === "string" && transactionSchemaObjectIdKeys.has(value);
}
exports.isTransactionObjectIdKey = isTransactionObjectIdKey;
function setTransactionSchema(schema, collection, options = {}) {
    const { defaultIndexes = true } = options;
    delete mongoose_1.connection.models["Medici_Transaction"];
    if (defaultIndexes) {
        schema.index({ _journal: 1 });
        schema.index({
            accounts: 1,
            book: 1,
            datetime: -1,
            timestamp: -1,
        });
        schema.index({
            datetime: -1,
            timestamp: -1,
        });
        schema.index({ "account_path.0": 1, book: 1 });
        schema.index({
            "account_path.0": 1,
            "account_path.1": 1,
            book: 1,
        });
        schema.index({
            "account_path.0": 1,
            "account_path.1": 1,
            "account_path.2": 1,
            book: 1,
        });
    }
    exports.transactionModel = (0, mongoose_1.model)("Medici_Transaction", schema, collection);
    transactionSchemaKeys = new Set(Object.keys(schema.paths));
    transactionSchemaObjectIdKeys = (0, extractObjectIdKeysFromSchema_1.extractObjectIdKeysFromSchema)(schema);
}
exports.setTransactionSchema = setTransactionSchema;
!mongoose_1.connection.models["Medici_Transaction"] && setTransactionSchema(exports.transactionSchema);
