"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncIndexes = void 0;
const journal_1 = require("../models/journal");
const lock_1 = require("../models/lock");
const transaction_1 = require("../models/transaction");
const balance_1 = require("../models/balance");
/**
 * Will execute mongoose model's `syncIndexes()` for all medici models.
 * WARNING! This will erase any custom (non-builtin) indexes you might have added.
 * @param [options] {{background: Boolean}}
 */
async function syncIndexes(options) {
    await journal_1.journalModel.syncIndexes(options);
    await transaction_1.transactionModel.syncIndexes(options);
    await lock_1.lockModel.syncIndexes(options);
    await balance_1.balanceModel.syncIndexes(options);
}
exports.syncIndexes = syncIndexes;
