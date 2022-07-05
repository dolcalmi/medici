"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDateQuery = exports.parseDateField = void 0;
const numberRE = /^\d+$/;
function parseDateField(value) {
    if (value instanceof Date) {
        return value;
    }
    else if (typeof value === "number") {
        return new Date(value);
    }
    else if (typeof value === "string" && numberRE.test(value)) {
        return new Date(parseInt(value));
    }
    else if (typeof value === "string") {
        return new Date(value);
    }
    // Using JS type auto conversion. This code can lose milliseconds. By design.
    // Consider throwing exception in the next breaking release.
    const parsed = Date.parse(value);
    if (parsed)
        return new Date(parsed);
}
exports.parseDateField = parseDateField;
function parseDateQuery(start_date, end_date) {
    const datetime = {};
    if (start_date) {
        datetime.$gte = parseDateField(start_date);
    }
    if (end_date) {
        datetime.$lte = parseDateField(end_date);
    }
    return datetime;
}
exports.parseDateQuery = parseDateQuery;
