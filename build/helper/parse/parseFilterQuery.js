"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFilterQuery = void 0;
const mongoose_1 = require("mongoose");
const transaction_1 = require("../../models/transaction");
const isPrototypeAttribute_1 = require("../isPrototypeAttribute");
const parseAccountField_1 = require("./parseAccountField");
const parseDateField_1 = require("./parseDateField");
const flattenObject_1 = require("../flattenObject");
/**
 * Turn query into an object readable by MongoDB.
 */
function parseFilterQuery(query, book) {
    const { account, start_date, end_date, ...extra } = query;
    const filterQuery = {
        book: book.name,
        ...(0, parseAccountField_1.parseAccountField)(account, book.maxAccountPath),
    };
    if (start_date || end_date) {
        filterQuery["datetime"] = (0, parseDateField_1.parseDateQuery)(start_date, end_date);
    }
    const meta = {};
    for (const [key, value] of Object.entries(extra)) {
        if ((0, isPrototypeAttribute_1.isPrototypeAttribute)(key))
            continue;
        let newValue = value;
        if (typeof value === "string" && (0, transaction_1.isTransactionObjectIdKey)(key)) {
            newValue = new mongoose_1.Types.ObjectId(value);
        }
        if ((0, transaction_1.isValidTransactionKey)(key)) {
            filterQuery[key] = newValue;
        }
        else {
            meta[key] = newValue;
        }
    }
    return { ...filterQuery, ...(0, flattenObject_1.flattenObject)(meta, "meta") };
}
exports.parseFilterQuery = parseFilterQuery;
