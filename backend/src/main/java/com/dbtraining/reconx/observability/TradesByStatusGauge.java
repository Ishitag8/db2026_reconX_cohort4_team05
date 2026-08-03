package com.dbtraining.reconx.observability;

import com.dbtraining.reconx.repository.TradeRepository;
import com.dbtraining.reconx.repository.entity.TradeStatus;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TradesByStatusGauge {

    public TradesByStatusGauge(MeterRegistry registry, TradeRepository repo) {
        for (TradeStatus status : List.of(TradeStatus.PENDING, TradeStatus.MATCHED, TradeStatus.UNMATCHED, TradeStatus.DISPUTED, TradeStatus.CANCELLED)) {
            Gauge.builder("trades_by_status", repo, r -> r.countByStatus(status))
                 .tag("status", status.name())
                 .description("Trades currently in a given status")
                 .register(registry);
        }
    }
}