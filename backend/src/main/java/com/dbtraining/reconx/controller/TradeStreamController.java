package com.dbtraining.reconx.controller;

import com.dbtraining.reconx.repository.entity.Trade;
import com.dbtraining.reconx.dto.TradeMapper;
import com.dbtraining.reconx.dto.TradeResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * TICKET-ADV104 — Server-Sent Events stream for live trade feed.
 * Exposes GET /api/v1/trades/stream (unauthenticated / public for browser EventSource compatibility).
 */
@RestController
@RequestMapping("/v1/trades")
@CrossOrigin(origins = "*")
public class TradeStreamController {

    private static final Logger log = LoggerFactory.getLogger(TradeStreamController.class);
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final TradeMapper mapper;

    public TradeStreamController(TradeMapper mapper) {
        this.mapper = mapper;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamTrades() {
        SseEmitter emitter = new SseEmitter(1800000L); // 30-minute connection duration limit
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((ex) -> emitters.remove(emitter));

        // Immediately send a handshake/comment connection confirmation message
        try {
            emitter.send(SseEmitter.event().comment("connection established"));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        log.info("New subscriber connected to trade stream. Total active connections: {}", emitters.size());
        return emitter;
    }

    @EventListener
    public void handleTradeSaved(Trade trade) {
        TradeResponse response = mapper.toResponse(trade);
        log.info("Broadcasting trade event to SSE clients: {} - {}", response.tradeRef(), response.status());

        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(response, MediaType.APPLICATION_JSON);
            } catch (IOException | IllegalStateException e) {
                deadEmitters.add(emitter);
            }
        }
        emitters.removeAll(deadEmitters);
    }
}
