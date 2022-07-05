"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLockSchema = exports.lockModel = void 0;
const mongoose_1 = require("mongoose");
const lockSchema = new mongoose_1.Schema({
    book: String,
    account: String,
    updatedAt: Date,
    __v: Number,
}, { id: false, versionKey: false, timestamps: false });
lockSchema.index({
    account: 1,
    book: 1,
}, { unique: true });
lockSchema.index({
    updatedAt: 1,
}, { expireAfterSeconds: 60 * 60 * 24 });
function setLockSchema(schema, collection) {
    delete mongoose_1.connection.models["Medici_Lock"];
    exports.lockModel = (0, mongoose_1.model)("Medici_Lock", schema, collection);
}
exports.setLockSchema = setLockSchema;
!mongoose_1.connection.models["Medici_Lock"] && setLockSchema(lockSchema);
