package com.dbtraining.reconx.exception;

/** TICKET-ADV025 — 409 Conflict: tradeRef already exists. */
public class DuplicateTradeRefException extends ReconException {
    public DuplicateTradeRefException(String tradeRef) {
        super(tradeRef);
    }
    public DuplicateTradeRefException(String tradeRef, Throwable cause) {
        super(tradeRef, cause);
    }
}
