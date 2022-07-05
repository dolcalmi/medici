"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleVoidMemo = void 0;
const voidRE = /^\[VOID\]/;
const unvoidRE = /^\[UNVOID\]/;
const revoidRE = /^\[REVOID\]/;
function handleVoidMemo(reason, memo) {
    if (reason) {
        return reason;
    }
    else if (!memo) {
        return "[VOID]";
    }
    else if (voidRE.test(memo)) {
        return memo.replace("[VOID]", "[UNVOID]");
    }
    else if (unvoidRE.test(memo)) {
        return memo.replace("[UNVOID]", "[REVOID]");
    }
    else if (revoidRE.test(memo)) {
        return memo.replace("[REVOID]", "[UNVOID]");
    }
    else {
        return `[VOID] ${memo}`;
    }
}
exports.handleVoidMemo = handleVoidMemo;
