"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entry = void 0;
const mongoose_1 = require("mongoose");
const errors_1 = require("./errors");
const transaction_1 = require("./models/transaction");
const journal_1 = require("./models/journal");
const isPrototypeAttribute_1 = require("./helper/isPrototypeAttribute");
const parseDateField_1 = require("./helper/parse/parseDateField");
class Entry {
    constructor(book, memo, date, original_journal) {
        this.transactions = [];
        this.timestamp = new Date();
        this.book = book;
        this.journal = new journal_1.journalModel();
        this.journal.memo = String(memo);
        if (original_journal) {
            this.journal._original_journal =
                typeof original_journal === "string" ? new mongoose_1.Types.ObjectId(original_journal) : original_journal;
        }
        this.journal.datetime = (0, parseDateField_1.parseDateField)(date) || new Date();
        this.journal.book = this.book.name;
        this.transactions = [];
    }
    static write(book, memo, date, original_journal) {
        return new this(book, memo, date, original_journal);
    }
    transact(type, account_path, amount, extra) {
        if (typeof account_path === "string") {
            account_path = account_path.split(":");
        }
        if (account_path.length > this.book.maxAccountPath) {
            throw new errors_1.InvalidAccountPathLengthError(`Account path is too deep (maximum ${this.book.maxAccountPath})`);
        }
        amount = typeof amount === "string" ? parseFloat(amount) : amount;
        const credit = type === 1 ? amount : 0.0;
        const debit = type === -1 ? amount : 0.0;
        const transaction = {
            // _id: keys are generated on the database side for better consistency
            _journal: this.journal._id,
            account_path,
            accounts: account_path.join(":"),
            book: this.book.name,
            credit,
            datetime: this.journal.datetime,
            debit,
            memo: this.journal.memo,
            timestamp: this.timestamp,
        };
        if (this.journal._original_journal) {
            transaction._original_journal = this.journal._original_journal;
        }
        if (extra) {
            for (const [key, value] of Object.entries(extra)) {
                if ((0, isPrototypeAttribute_1.isPrototypeAttribute)(key))
                    continue;
                if ((0, transaction_1.isValidTransactionKey)(key)) {
                    transaction[key] = value;
                }
                else {
                    if (!transaction.meta)
                        transaction.meta = {};
                    transaction.meta[key] = value;
                }
            }
        }
        // We set again timestamp to ensure there is no tampering with the timestamp
        transaction.timestamp = this.timestamp;
        this.transactions.push(transaction);
        return this;
    }
    credit(account_path, amount, extra = null) {
        return this.transact(1, account_path, amount, extra);
    }
    debit(account_path, amount, extra = null) {
        return this.transact(-1, account_path, amount, extra);
    }
    async commit(options = {}) {
        let total = 0.0;
        for (const tx of this.transactions) {
            // sum the value of the transaction
            total += tx.credit - tx.debit;
        }
        total = parseFloat(total.toFixed(this.book.precision));
        if (total !== 0) {
            throw new errors_1.TransactionError("INVALID_JOURNAL: can't commit non zero total", total);
        }
        try {
            await Promise.all(this.transactions.map((tx) => new transaction_1.transactionModel(tx).validate()));
            await this.journal.validate();
            const result = await transaction_1.transactionModel.collection.insertMany(this.transactions, {
                forceServerObjectId: true,
                ordered: true,
                session: options.session,
                writeConcern: options.session ? undefined : { w: 1, j: true }, // Ensure at least ONE node wrote to JOURNAL (disk)
            });
            let insertedIds = Object.values(result.insertedIds);
            if (insertedIds.length !== this.transactions.length) {
                throw new errors_1.TransactionError(`Saved only ${insertedIds.length} of ${this.transactions.length} transactions`, total);
            }
            if (!insertedIds[0]) {
                // Mongo returns `undefined` as the insertedIds when forceServerObjectId=true. Let's re-read it.
                const txs = await transaction_1.transactionModel.collection
                    .find({ _journal: this.transactions[0]._journal }, { projection: { _id: 1 }, session: options.session })
                    .toArray();
                insertedIds = txs.map((tx) => tx._id);
            }
            this.journal._transactions = insertedIds;
            await journal_1.journalModel.collection.insertOne(this.journal.toObject(), options);
            if (options.writelockAccounts && options.session) {
                const writelockAccounts = options.writelockAccounts instanceof RegExp
                    ? this.transactions
                        .filter((tx) => options.writelockAccounts.test(tx.accounts))
                        .map((tx) => tx.accounts)
                    : options.writelockAccounts;
                await this.book.writelockAccounts(writelockAccounts, {
                    session: options.session,
                });
            }
            return this.journal;
        }
        catch (err) {
            if (!options.session) {
                throw new errors_1.TransactionError(`Failure to save journal: ${err.message}`, total);
            }
            throw err;
        }
    }
}
exports.Entry = Entry;
exports.default = Entry;
