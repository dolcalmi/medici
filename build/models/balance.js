"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBestSnapshot = exports.snapshotBalance = exports.constructKey = exports.hashKey = exports.setBalanceSchema = exports.balanceModel = void 0;
const crypto_1 = require("crypto");
const mongoose_1 = require("mongoose");
const flattenObject_1 = require("../helper/flattenObject");
const balanceSchema = new mongoose_1.Schema({
    key: String,
    book: String,
    account: String,
    transaction: mongoose_1.Types.ObjectId,
    meta: mongoose_1.Schema.Types.Mixed,
    balance: Number,
    notes: Number,
    createdAt: Date,
    expireAt: Date,
}, { id: false, versionKey: false, timestamps: false });
balanceSchema.index({ key: 1 });
balanceSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
function setBalanceSchema(schema, collection) {
    delete mongoose_1.connection.models["Medici_Balance"];
    exports.balanceModel = (0, mongoose_1.model)("Medici_Balance", schema, collection);
}
exports.setBalanceSchema = setBalanceSchema;
!mongoose_1.connection.models["Medici_Balance"] && setBalanceSchema(balanceSchema);
function hashKey(key) {
    return (0, crypto_1.createHash)("sha1").update(key).digest().toString("latin1");
}
exports.hashKey = hashKey;
function constructKey(book, account, meta) {
    // Example of a simple key: "My book;Liabilities:12345"
    // Example of a complex key: "My book;Liabilities:Client,Liabilities:Client Pending;clientId.$in.0:12345,clientId.$in.1:67890"
    const key = [
        book,
        account,
        Object.entries((0, flattenObject_1.flattenObject)(meta, "", true))
            .sort()
            .map(([key, value]) => key + ":" + value)
            .join(),
    ]
        .filter(Boolean)
        .join(";");
    return hashKey(key);
}
exports.constructKey = constructKey;
async function snapshotBalance(balanceData, options = {}) {
    const key = constructKey(balanceData.book, balanceData.account, balanceData.meta);
    const balanceDoc = {
        key,
        book: balanceData.book,
        account: balanceData.account,
        meta: JSON.stringify(balanceData.meta),
        transaction: balanceData.transaction,
        balance: balanceData.balance,
        notes: balanceData.notes,
        createdAt: new Date(),
        expireAt: new Date(Date.now() + balanceData.expireInSec * 1000),
    };
    const result = await exports.balanceModel.collection.insertOne(balanceDoc, {
        session: options.session,
        writeConcern: options.session ? undefined : { w: 1, j: true },
        forceServerObjectId: true,
    });
    return result.acknowledged;
}
exports.snapshotBalance = snapshotBalance;
function getBestSnapshot(query, options = {}) {
    const { book, account, meta, ...extras } = query;
    const key = constructKey(book, account, { ...meta, ...extras });
    return exports.balanceModel.collection.findOne({ key }, { sort: { _id: -1 }, session: options.session });
}
exports.getBestSnapshot = getBestSnapshot;
