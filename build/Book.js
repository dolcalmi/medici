"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Book = void 0;
const mongoose_1 = require("mongoose");
const errors_1 = require("./errors");
const handleVoidMemo_1 = require("./helper/handleVoidMemo");
const addReversedTransactions_1 = require("./helper/addReversedTransactions");
const parseFilterQuery_1 = require("./helper/parse/parseFilterQuery");
const parseBalanceQuery_1 = require("./helper/parse/parseBalanceQuery");
const Entry_1 = require("./Entry");
const journal_1 = require("./models/journal");
const transaction_1 = require("./models/transaction");
const lock_1 = require("./models/lock");
const balance_1 = require("./models/balance");
const GROUP = {
    $group: {
        _id: null,
        balance: { $sum: { $subtract: ["$credit", "$debit"] } },
        notes: { $sum: 1 },
        lastTransactionId: { $max: "$_id" },
    },
};
class Book {
    constructor(name, options = {}) {
        this.name = name;
        this.precision = options.precision != null ? options.precision : 8;
        this.maxAccountPath = options.maxAccountPath != null ? options.maxAccountPath : 3;
        this.balanceSnapshotSec = options.balanceSnapshotSec != null ? options.balanceSnapshotSec : 24 * 60 * 60;
        this.expireBalanceSnapshotSec =
            options.expireBalanceSnapshotSec != null ? options.expireBalanceSnapshotSec : 2 * this.balanceSnapshotSec;
        if (typeof this.name !== "string" || this.name.trim().length === 0) {
            throw new errors_1.BookConstructorError("Invalid value for name provided.");
        }
        if (typeof this.precision !== "number" || !Number.isInteger(this.precision) || this.precision < 0) {
            throw new errors_1.BookConstructorError("Invalid value for precision provided.");
        }
        if (typeof this.maxAccountPath !== "number" || !Number.isInteger(this.maxAccountPath) || this.maxAccountPath < 0) {
            throw new errors_1.BookConstructorError("Invalid value for maxAccountPath provided.");
        }
        if (typeof this.balanceSnapshotSec !== "number" || this.balanceSnapshotSec < 0) {
            throw new errors_1.BookConstructorError("Invalid value for balanceSnapshotSec provided.");
        }
        if (typeof this.expireBalanceSnapshotSec !== "number" || this.expireBalanceSnapshotSec < 0) {
            throw new errors_1.BookConstructorError("Invalid value for expireBalanceSnapshotSec provided.");
        }
    }
    entry(memo, date = null, original_journal) {
        return Entry_1.Entry.write(this, memo, date, original_journal);
    }
    async balance(query, options = {}) {
        const parsedQuery = (0, parseBalanceQuery_1.parseBalanceQuery)(query, this);
        const meta = parsedQuery.meta;
        delete parsedQuery.meta;
        let balanceSnapshot = null;
        let accountForBalanceSnapshot;
        if (this.balanceSnapshotSec) {
            accountForBalanceSnapshot = query.account ? [].concat(query.account).join() : undefined;
            balanceSnapshot = await (0, balance_1.getBestSnapshot)({
                book: parsedQuery.book,
                account: accountForBalanceSnapshot,
                meta,
            }, options);
            if (balanceSnapshot) {
                // Use cached balance
                parsedQuery._id = { $gt: balanceSnapshot.transaction };
            }
        }
        const match = { $match: parsedQuery };
        const result = (await transaction_1.transactionModel.collection.aggregate([match, GROUP], options).toArray())[0];
        let balance = 0;
        let notes = 0;
        if (balanceSnapshot) {
            balance += balanceSnapshot.balance;
            notes += balanceSnapshot.notes;
        }
        if (result) {
            balance += parseFloat(result.balance.toFixed(this.precision));
            notes += result.notes;
            // We can do snapshots only if there is at least one entry for this balance
            if (this.balanceSnapshotSec && result.lastTransactionId) {
                // It's the first (ever?) snapshot for this balance. We just need to save whatever we've just aggregated
                // so that the very next balance query would use cached snapshot.
                if (!balanceSnapshot) {
                    await (0, balance_1.snapshotBalance)({
                        book: this.name,
                        account: accountForBalanceSnapshot,
                        meta,
                        transaction: result.lastTransactionId,
                        balance,
                        notes,
                        expireInSec: this.expireBalanceSnapshotSec,
                    }, options);
                }
                else {
                    // There is a snapshot already. But let's check if it's too old.
                    const tooOld = Date.now() > balanceSnapshot.createdAt.getTime() + this.balanceSnapshotSec * 1000;
                    // If it's too old we would need to cache another snapshot.
                    if (tooOld) {
                        delete parsedQuery._id;
                        const match = { $match: parsedQuery };
                        // Important! We are going to recalculate the entire balance from the day one.
                        // Since this operation can take seconds (if you have millions of documents)
                        // we better run this query IN THE BACKGROUND.
                        // If this exact balance query would be executed multiple times at the same second we might end up with
                        // multiple snapshots in the database. Which is fine. The chance of this happening is low.
                        // Our main goal here is not to delay this .balance() method call. The tradeoff is that
                        // database will use 100% CPU for few (milli)seconds, which is fine. It's all fine (C)
                        transaction_1.transactionModel.collection
                            .aggregate([match, GROUP], options)
                            .toArray()
                            .then((results) => {
                            const resultFull = results[0];
                            return (0, balance_1.snapshotBalance)({
                                book: this.name,
                                account: accountForBalanceSnapshot,
                                meta,
                                transaction: resultFull.lastTransactionId,
                                balance: parseFloat(resultFull.balance.toFixed(this.precision)),
                                notes: resultFull.notes,
                                expireInSec: this.expireBalanceSnapshotSec,
                            }, options);
                        })
                            .catch((error) => {
                            console.error("medici: Couldn't do background balance snapshot.", error);
                        });
                    }
                }
            }
        }
        return { balance, notes };
    }
    async ledger(query, options = {}) {
        // Pagination
        const { perPage, page, ...restOfQuery } = query;
        const paginationOptions = {};
        if (typeof perPage === "number" && Number.isSafeInteger(perPage)) {
            paginationOptions.skip = (Number.isSafeInteger(page) ? page - 1 : 0) * perPage;
            paginationOptions.limit = perPage;
        }
        const filterQuery = (0, parseFilterQuery_1.parseFilterQuery)(restOfQuery, this);
        const findPromise = transaction_1.transactionModel.collection
            .find(filterQuery, {
            ...paginationOptions,
            sort: {
                datetime: -1,
                timestamp: -1,
            },
            session: options.session,
        })
            .toArray();
        let countPromise = Promise.resolve(0);
        if (paginationOptions.limit) {
            countPromise = transaction_1.transactionModel.collection.countDocuments(filterQuery, { session: options.session });
        }
        const results = await findPromise;
        return {
            results,
            total: (await countPromise) || results.length,
        };
    }
    async void(journal_id, reason, options = {}) {
        journal_id = typeof journal_id === "string" ? new mongoose_1.Types.ObjectId(journal_id) : journal_id;
        const journal = await journal_1.journalModel.collection.findOne({
            _id: journal_id,
            book: this.name,
        }, {
            session: options.session,
            projection: {
                _id: true,
                _transactions: true,
                memo: true,
                void_reason: true,
                voided: true,
            },
        });
        if (journal === null) {
            throw new errors_1.JournalNotFoundError();
        }
        if (journal.voided) {
            throw new errors_1.JournalAlreadyVoidedError();
        }
        reason = (0, handleVoidMemo_1.handleVoidMemo)(reason, journal.memo);
        // Not using options.session here as this read operation is not necessary to be in the ACID session.
        const transactions = await transaction_1.transactionModel.collection.find({ _journal: journal._id }).toArray();
        if (transactions.length !== journal._transactions.length) {
            throw new errors_1.MediciError(`Transactions for journal ${journal._id} not found on book ${journal.book}`);
        }
        const entry = this.entry(reason, null, journal_id);
        (0, addReversedTransactions_1.addReversedTransactions)(entry, transactions);
        // Set this journal to void with reason and also set all associated transactions
        const resultOne = await journal_1.journalModel.collection.updateOne({ _id: journal._id }, { $set: { voided: true, void_reason: reason } }, {
            session: options.session,
            writeConcern: options.session ? undefined : { w: 1, j: true }, // Ensure at least ONE node wrote to JOURNAL (disk)
        });
        // This can happen if someone read a journal, then deleted it from DB, then tried voiding. Full stop.
        if (resultOne.matchedCount === 0)
            throw new errors_1.ConsistencyError(`Failed to void ${journal.memo} ${journal._id} journal on book ${journal.book}`);
        // Someone else voided! Is it two simultaneous voidings? Let's stop our void action altogether.
        if (resultOne.modifiedCount === 0)
            throw new errors_1.ConsistencyError(`Already voided ${journal.memo} ${journal._id} journal on book ${journal.book}`);
        const resultMany = await transaction_1.transactionModel.collection.updateMany({ _journal: journal._id }, { $set: { voided: true, void_reason: reason } }, {
            session: options.session,
            writeConcern: options.session ? undefined : { w: 1, j: true }, // Ensure at least ONE node wrote to JOURNAL (disk)
        });
        // At this stage we have to make sure the `commit()` is executed.
        // Let's not make the DB even more inconsistent if something wild happens. Let's not throw, instead log to stderr.
        if (resultMany.matchedCount !== transactions.length)
            throw new errors_1.ConsistencyError(`Failed to void all ${journal.memo} ${journal._id} journal transactions on book ${journal.book}`);
        if (resultMany.modifiedCount === 0)
            throw new errors_1.ConsistencyError(`Already voided ${journal.memo} ${journal._id} journal transactions on book ${journal.book}`);
        return entry.commit(options);
    }
    async writelockAccounts(accounts, options) {
        accounts = Array.from(new Set(accounts));
        // ISBN: 978-1-4842-6879-7. MongoDB Performance Tuning (2021), p. 217
        // Reduce the Chance of Transient Transaction Errors by moving the
        // contentious statement to the end of the transaction.
        for (const account of accounts) {
            await lock_1.lockModel.collection.updateOne({ account, book: this.name }, {
                $set: { updatedAt: new Date() },
                $setOnInsert: { book: this.name, account },
                $inc: { __v: 1 },
            }, { upsert: true, session: options.session });
        }
        return this;
    }
    async listAccounts(options = {}) {
        const results = await transaction_1.transactionModel.collection.distinct("accounts", { book: this.name }, { session: options.session });
        const uniqueAccounts = new Set();
        for (const result of results) {
            const prev = [];
            const paths = result.split(":");
            for (const acct of paths) {
                prev.push(acct);
                uniqueAccounts.add(prev.join(":"));
            }
        }
        return Array.from(uniqueAccounts);
    }
}
exports.Book = Book;
exports.default = Book;
