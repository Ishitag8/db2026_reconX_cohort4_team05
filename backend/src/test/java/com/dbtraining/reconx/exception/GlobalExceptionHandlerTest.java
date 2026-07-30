package com.dbtraining.reconx.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void tradeNotFound_maps404() {
        ProblemDetail pd = handler.notFound(new TradeNotFoundException("EQU-20260603-0001"));
        assertThat(pd.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
        assertThat(pd.getTitle()).isEqualTo("Trade not found");
        assertThat(pd.getType().toString()).endsWith("/trade-not-found");
        assertThat(pd.getProperties()).containsKey("timestamp");
    }

    @Test
    void duplicateTradeRef_maps409() {
        ProblemDetail pd = handler.duplicate(new DuplicateTradeRefException("EQU-20260603-0002"));
        assertThat(pd.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
        assertThat(pd.getType().toString()).endsWith("/duplicate-trade-ref");
    }

    @Test
    void invalidTrade_maps400() {
        ProblemDetail pd = handler.invalid(new InvalidTradeException("quantity must be positive"));
        assertThat(pd.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(pd.getType().toString()).endsWith("/invalid-trade");
    }

    @Test
    void reconciliationMismatch_maps422() {
        ProblemDetail pd = handler.mismatch(new ReconciliationMismatchException("price mismatch"));
        assertThat(pd.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY.value());
        assertThat(pd.getType().toString()).endsWith("/reconciliation-mismatch");
    }

    @Test
    void unhandledException_maps500_andDoesNotLeakMessage() {
        ProblemDetail pd = handler.handleAny(new RuntimeException("some internal secret detail"));
        assertThat(pd.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR.value());
        assertThat(pd.getTitle()).isEqualTo("Internal server error");
        assertThat(pd.getDetail()).doesNotContain("some internal secret detail");
    }
}