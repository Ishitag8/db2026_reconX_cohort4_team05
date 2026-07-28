package com.dbtraining.reconx.exception;

/** TICKET-ADV025 — 404 Not Found: tradeRef has no row in trades. */
public class TradeNotFoundException extends ReconException {
    public TradeNotFoundException(String tradeRef) {
        super(tradeRef);
    }
    public TradeNotFoundException(String tradeRef, Throwable cause){
        super(tradeRef, cause);
    }
    public TradeNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
