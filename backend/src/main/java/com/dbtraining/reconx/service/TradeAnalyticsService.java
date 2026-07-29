package com.dbtraining.reconx.service;

import com.dbtraining.reconx.model.BondTrade;
import com.dbtraining.reconx.model.DerivativeTrade;
import com.dbtraining.reconx.model.EquityTrade;
import com.dbtraining.reconx.model.FXTrade;
import com.dbtraining.reconx.model.Side;
import com.dbtraining.reconx.model.TradeType;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TradeAnalyticsService {

    public Map<Long, NotionalSummary> notionalByCounterparty(List<? extends TradeType> trades) {
        return trades.stream().collect(Collectors.groupingBy(
                t -> counterpartyIdOf(t),
                Collectors.collectingAndThen(
                        Collectors.toList(),
                        list -> new NotionalSummary(
                                list.size(),
                                list.stream()
                                        .map(t -> t.notional().amount())
                                        .reduce(BigDecimal.ZERO, BigDecimal::add)))));
    }

    public Map<String, BigDecimal> vwapByInstrument(List<EquityTrade> equityTrades) {
        if (equityTrades == null || equityTrades.isEmpty())
            return Map.of();
        Map<String, List<EquityTrade>> bySymbol = equityTrades.stream()
                .collect(Collectors.groupingBy(EquityTrade::instrumentSymbol));

        return bySymbol.entrySet().stream().collect(Collectors.toMap(
                Map.Entry::getKey,
                e -> {
                    BigDecimal totalQty = e.getValue().stream()
                            .map(EquityTrade::quantity)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    if (totalQty.signum() == 0) return BigDecimal.ZERO;
                    BigDecimal weighted = e.getValue().stream()
                            .map(t -> t.price().multiply(t.quantity()))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return weighted.divide(totalQty, 4, RoundingMode.HALF_UP);
                }
        ));
    }

    public Map<String, BigDecimal> pnlByInstrument(List<EquityTrade> equityTrades) {
        if (equityTrades == null || equityTrades.isEmpty())
            return Map.of();
        return equityTrades.stream().collect(Collectors.groupingBy(
                EquityTrade::instrumentSymbol,
                Collectors.mapping(this::pnl,
                        Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))));
    }

    private BigDecimal pnl(EquityTrade t) {
        BigDecimal abs = t.price().multiply(t.quantity());
        return t.side() == Side.SELL ? abs : abs.negate();
    }

    private long counterpartyIdOf(TradeType t) {
        return switch (t) {
            case EquityTrade e -> e.counterpartyId();
            case com.dbtraining.reconx.model.FXTrade fx -> fx.counterpartyId();
            case com.dbtraining.reconx.model.BondTrade b -> b.counterpartyId();
            case com.dbtraining.reconx.model.DerivativeTrade d -> d.counterpartyId();
        };
    }

    public record NotionalSummary(long count, BigDecimal total) {
    }
}
