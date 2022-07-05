"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addReversedTransactions = void 0;
const safeSetKeyToMetaObject_1 = require("./safeSetKeyToMetaObject");
function addReversedTransactions(entry, transactions) {
    for (const transaction of transactions) {
        const newMeta = {};
        for (const [key, value] of Object.entries(transaction)) {
            if (key === "meta") {
                for (const [keyMeta, valueMeta] of Object.entries(value)) {
                    (0, safeSetKeyToMetaObject_1.safeSetKeyToMetaObject)(keyMeta, valueMeta, newMeta);
                }
            }
            else {
                (0, safeSetKeyToMetaObject_1.safeSetKeyToMetaObject)(key, value, newMeta);
            }
        }
        if (transaction.credit) {
            entry.debit(transaction.account_path, transaction.credit, newMeta);
        }
        if (transaction.debit) {
            entry.credit(transaction.account_path, transaction.debit, newMeta);
        }
    }
}
exports.addReversedTransactions = addReversedTransactions;
