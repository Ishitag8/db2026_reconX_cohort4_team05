package com.dbtraining.reconx.dto;

import java.math.BigDecimal;

public record TradeStatsResponse(
        BigDecimal totalPortfolioValue,
        long totalTrades,
        long matchedTrades,
        long openBreaks
) {}
