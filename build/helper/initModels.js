"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initModels = void 0;
const journal_1 = require("../models/journal");
const transaction_1 = require("../models/transaction");
const lock_1 = require("../models/lock");
const balance_1 = require("../models/balance");
async function initModels() {
    await journal_1.journalModel.init();
    await transaction_1.transactionModel.init();
    await lock_1.lockModel.init();
    await balance_1.balanceModel.init();
}
exports.initModels = initModels;
