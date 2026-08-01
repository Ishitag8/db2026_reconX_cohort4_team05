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
        for (String status : List.of("PENDING","MATCHED","UNMATCHED","DISPUTED","CANCELLED")) {
            TradeStatus enumStatus = TradeStatus.valueOf(status);
            Gauge.builder("trades_by_status", repo, r -> r.countByStatus(enumStatus))
                 .tag("status", status)
                 .description("Trades currently in a given status")
                 .register(registry);
        }
    }
}