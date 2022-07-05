"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setJournalSchema = exports.journalModel = void 0;
const mongoose_1 = require("mongoose");
const journalSchema = new mongoose_1.Schema({
    datetime: Date,
    memo: {
        type: String,
        default: "",
    },
    _transactions: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Medici_Transaction",
        },
    ],
    book: String,
    voided: Boolean,
    void_reason: String,
}, { id: false, versionKey: false, timestamps: false });
function setJournalSchema(schema, collection) {
    delete mongoose_1.connection.models["Medici_Journal"];
    exports.journalModel = (0, mongoose_1.model)("Medici_Journal", schema, collection);
}
exports.setJournalSchema = setJournalSchema;
!mongoose_1.connection.models["Medici_Journal"] && setJournalSchema(journalSchema);
