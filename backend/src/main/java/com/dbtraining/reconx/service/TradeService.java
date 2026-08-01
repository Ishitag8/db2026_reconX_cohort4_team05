package com.dbtraining.reconx.service;

import com.dbtraining.reconx.dto.TradeEvent;
import com.dbtraining.reconx.dto.TradeRequest;
import com.dbtraining.reconx.exception.DuplicateTradeRefException;
import com.dbtraining.reconx.exception.InvalidTradeException;
import com.dbtraining.reconx.exception.TradeNotFoundException;
import com.dbtraining.reconx.kafka.TradeEventProducer;
import com.dbtraining.reconx.observability.TradeMetrics;
import com.dbtraining.reconx.repository.CounterpartyRepository;
import com.dbtraining.reconx.repository.InstrumentRepository;
import com.dbtraining.reconx.repository.TradeRepository;
import com.dbtraining.reconx.repository.entity.Trade;
import com.dbtraining.reconx.repository.entity.TradeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static com.dbtraining.reconx.repository.TradeSpecifications.*;



/**
 * ============================================================================
 * TICKET-ADV064 — TradeService.create (POST endpoint backing)
 * TICKET-ADV065 — update
 * TICKET-ADV066 — updateStatus (PATCH)
 * TICKET-ADV067 — softDelete
 * TICKET-ADV083 — increments trade_created_total Counter on create
 * TICKET-ADV129 — publishes TradeEvent on every state change
 * TICKET-ADV055/ADV056 — list() uses Specifications + filter query
 * ============================================================================
 */


@Service
@Transactional
public class TradeService {

    private final TradeRepository tradeRepo;
    private final CounterpartyRepository cpRepo;
    private final InstrumentRepository instRepo;
    private final TradeEventProducer events;
    private final TradeMetrics metrics;
    private final ApplicationEventPublisher publisher;

    public TradeService(TradeRepository tradeRepo,
                        CounterpartyRepository cpRepo,
                        InstrumentRepository instRepo,
                        TradeEventProducer events,
                        TradeMetrics metrics,
                        ApplicationEventPublisher publisher) {
        this.tradeRepo = tradeRepo;
        this.cpRepo = cpRepo;
        this.instRepo = instRepo;
        this.events = events;
        this.metrics = metrics;
        this.publisher = publisher;
    }

    private static void initLazyRelations(Trade trade) {
        if (trade != null) {
            if (trade.getInstrument() != null) {
                trade.getInstrument().getSymbol();
            }
            if (trade.getCounterparty() != null) {
                trade.getCounterparty().getName();
            }
        }
    }

    public Trade create(TradeRequest req, String actor) {

        tradeRepo.findByTradeRef(req.tradeRef()).ifPresent(t -> {
            throw new DuplicateTradeRefException(req.tradeRef());
        });

        var instrument = instRepo.findById(req.instrumentId())
                .orElseThrow(() ->
                        new TradeNotFoundException("instrument " + req.instrumentId()));

        var counterparty = cpRepo.findById(req.counterpartyId())
                .orElseThrow(() ->
                        new TradeNotFoundException("counterparty " + req.counterpartyId()));

        Trade trade = new Trade();
        trade.setTradeRef(req.tradeRef());
        trade.setInstrument(instrument);
        trade.setCounterparty(counterparty);
        trade.setAssetClass(req.assetClass());
        trade.setSide(req.side());
        trade.setQuantity(req.quantity());
        trade.setPrice(req.price());
        trade.setTradeDate(req.tradeDate());
        trade.setStatus(TradeStatus.PENDING);

        Trade saved = tradeRepo.save(trade);
        initLazyRelations(saved);

        metrics.incrementTradeCreated();
        metrics.recordTradeValue(
                req.quantity().multiply(req.price()).doubleValue()
        );

        events.publish(new TradeEvent(
                UUID.randomUUID(),
                saved.getTradeRef(),
                TradeEvent.EventType.TRADE_CREATED,
                Instant.now(),
                actor,
                null,
                "status=" + saved.getStatus()
        ));

        publisher.publishEvent(saved);

        return saved;
    }

    public Trade update(Long id, TradeRequest req, String actor) {

        Trade trade = tradeRepo.findById(id)
                .orElseThrow(() ->
                        new TradeNotFoundException("id " + id));

        String before =
                "status=" + trade.getStatus()
                        + ",qty=" + trade.getQuantity()
                        + ",price=" + trade.getPrice();

        var instrument = instRepo.findById(req.instrumentId())
                .orElseThrow(() ->
                        new TradeNotFoundException("instrument " + req.instrumentId()));

        var counterparty = cpRepo.findById(req.counterpartyId())
                .orElseThrow(() ->
                        new TradeNotFoundException("counterparty " + req.counterpartyId()));

        trade.setInstrument(instrument);
        trade.setCounterparty(counterparty);
        trade.setAssetClass(req.assetClass());
        trade.setSide(req.side());
        trade.setQuantity(req.quantity());
        trade.setPrice(req.price());
        trade.setTradeDate(req.tradeDate());

        Trade saved = tradeRepo.save(trade);
        initLazyRelations(saved);

        events.publish(new TradeEvent(
                UUID.randomUUID(),
                saved.getTradeRef(),
                TradeEvent.EventType.TRADE_UPDATED,
                Instant.now(),
                actor,
                before,
                "qty=" + saved.getQuantity()
                        + ",price=" + saved.getPrice()
        ));

        publisher.publishEvent(saved);

        return saved;
    }

    public Trade updateStatus(Long id, String status, String actor) {

        TradeStatus newStatus;

        try {
            newStatus = TradeStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new InvalidTradeException("Invalid trade status: " + status);
        }

        Trade trade = tradeRepo.findById(id)
                .orElseThrow(() ->
                        new TradeNotFoundException("id " + id));

        String before = "status=" + trade.getStatus();

        trade.setStatus(newStatus);

        Trade saved = tradeRepo.save(trade);
        initLazyRelations(saved);

        events.publish(new TradeEvent(
                UUID.randomUUID(),
                saved.getTradeRef(),
                TradeEvent.EventType.TRADE_UPDATED,
                Instant.now(),
                actor,
                before,
                "status=" + saved.getStatus()
        ));

        publisher.publishEvent(saved);

        return saved;
    }

    public void softDelete(Long id, String actor) {

        Trade trade = tradeRepo.findById(id)
                .orElseThrow(() ->
                        new TradeNotFoundException("id=" + id));

        trade.softDelete();

        tradeRepo.save(trade);

        events.publish(new TradeEvent(
                UUID.randomUUID(),
                trade.getTradeRef(),
                TradeEvent.EventType.TRADE_CANCELLED,
                Instant.now(),
                actor,
                null,
                null
        ));

        publisher.publishEvent(trade);
    }

    @Transactional(readOnly = true)
    public Page<Trade> list(LocalDate from,
                            LocalDate to,
                            String status,
                            Long counterpartyId,
                            Pageable pageable) {

        Specification<Trade> spec = Specification
                .where(tradeDateBetween(from, to))
                .and(hasStatus(status))
                .and(hasCounterparty(counterpartyId));

        Page<Trade> page = tradeRepo.findAll(spec, pageable);
        page.forEach(TradeService::initLazyRelations);
        return page;
    }
}