package com.dbtraining.reconx.service;

import com.dbtraining.reconx.dto.ReconResult;
import com.dbtraining.reconx.model.*;
//import com.dbtraining.reconx.collector.ReconSummaryCollector;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * TICKET-ADV040 / ADV041 / ADV042 — TDD: write the test FIRST, then the impl.
 */
class ReconciliationEngineTest {

    private final ReconciliationEngine engine = new ReconciliationEngine();

    @Test
    @DisplayName("Exact match on price and quantity returns MATCHED")
    void testReconcile_exactMatch_returnsMatched() {
        var in = List.<TradeType>of(equity("EQU-20260603-0001", "100.00", "10"));
        var out = List.<TradeType>of(equity("EQU-20260603-0001", "100.00", "10"));

        List<ReconResult> results = engine.reconcile(in, out, ReconciliationRule.EXACT);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).status()).isEqualTo(ReconResult.Status.MATCHED);
        assertThat(results.get(0).tradeRef()).isEqualTo("EQU-20260603-0001");
    }

    @ParameterizedTest(name="price diff {0} stays within 1% tolerance -> MATCHED")
    @ValueSource(strings = {"0.10","0.50","0.99"})
    void testReconcile_priceTolerance_withinThreshold(String diff) {
        BigDecimal basePrice = new BigDecimal("100.00");
        var in = List.<TradeType>of(equity("EQU-20260603-0002", "100.00", "10"));
        var out = List.<TradeType>of(equity("EQU-20260603-0002", basePrice.add(new BigDecimal(diff)).toPlainString(), "10"));
        List<ReconResult> results = engine.reconcile(in, out, ReconciliationRule.PRICE_TOLERANCE_1PCT);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).status()).isEqualTo(ReconResult.Status.MATCHED);
    }

    @Test
    @DisplayName("Missing counterparty trade returns BREAK")
    void testReconcile_missingCounterpartyTrade_returnsBreak() {
        // GIVEN
        var in = List.<TradeType>of(equity("EQU-20260603-0003", "100.00", "10"));
        var out = List.<TradeType>of();

        //WHEN
        List<ReconResult> results = engine.reconcile(in, out, ReconciliationRule.EXACT);

        //THEN
        assertThat(results).hasSize(1);
        assertThat(results.get(0).status()).isEqualTo(ReconResult.Status.BREAK);
        assertThat(results.get(0).discrepancyType()).isEqualTo("MISSING_EXTERNAL");
    }

    @Test
    void testReconcile_emptyInternal_returnsEmpty() {
        List<ReconResult> results = engine.reconcile(List.of(), List.of(), ReconciliationRule.EXACT);
        assertThat(results).isEmpty();
    }

    @Test
@DisplayName("All mismatched trades produce zero matched summary")
void testReconcile_allMismatched_summaryShowsZeroMatched(){
    List<TradeType> internals= List.of(equity("EQU-20260603-0001","100.00","1000"),
                                    equity("EQU-20260603-0002","100.00","1000"),
                                    equity("EQU-20260603-0003","100.00","1000")
    );
    List<TradeType> externals= List.of(equity("EQU-20260603-0001","200.00","1000"),
                                    equity("EQU-20260603-0002","200.00","1000"),
                                    equity("EQU-20260603-0003","200.00","1000")
    );
    List<ReconResult> results=engine.reconcile(internals,externals,ReconciliationRule.EXACT);
    ReconSummary summary=results.stream().collect(new ReconSummaryCollector());
    assertThat(summary.total()).isEqualTo(3);
    assertThat(summary.matched()).isEqualTo(0);
    assertThat(summary.broken()).isEqualTo(3);
}

    private EquityTrade equity(String ref, String price, String qty) {
        return EquityTrade.builder()
                .tradeRef(TradeRef.of(ref))
                .instrumentSymbol("SAP.DE")
                .price(new BigDecimal(price))
                .quantity(new BigDecimal(qty))
                .currency("EUR").side(Side.BUY)
                .tradeDate(LocalDate.of(2026, 6, 3))
                .counterpartyId(1L)
                .build();
    }
}