-- ============================================================================
-- TICKET-ADV010 — VWAP per instrument per day (window function)
-- ============================================================================
SELECT
    t.id,
    t.trade_ref,
    t.instrument_id,
    i.symbol,
    t.trade_date,
    t.quantity,
    t.price,
    (t.quantity * t.price) AS notional,
    SUM(t.price * t.quantity) OVER (PARTITION BY t.instrument_id, t.trade_date)
        / NULLIF(SUM(t.quantity) OVER (PARTITION BY t.instrument_id, t.trade_date), 0) AS vwap,
    ROW_NUMBER() OVER (PARTITION BY t.instrument_id, t.trade_date ORDER BY t.created_at, t.id) AS intraday_seq
FROM trades t
JOIN instruments i ON i.id = t.instrument_id
WHERE t.deleted_at IS NULL
ORDER BY t.trade_date DESC, t.instrument_id, intraday_seq;


-- ============================================================================
-- TICKET-ADV011 — Recursive CTE: trade lifecycle (execution -> settlement
--                -> recon_break -> resolution)
-- ============================================================================
WITH RECURSIVE trade_lifecycle AS (
    SELECT
        t.id AS trade_id,
        t.trade_ref,
        1 AS stage,
        'EXECUTION'::text AS stage_name,
        t.created_at AS event_at,
        t.status::text AS event_status
    FROM trades t
    WHERE t.deleted_at IS NULL

    UNION ALL

    SELECT
        tl.trade_id,
        tl.trade_ref,
        tl.stage + 1,
        nxt.stage_name,
        nxt.event_at,
        nxt.event_status
    FROM trade_lifecycle tl
    JOIN LATERAL (
        SELECT
            'CONFIRMATION'::text AS stage_name,
            t.created_at + INTERVAL '1 minute' AS event_at,
            'CONFIRMED'::text AS event_status
        FROM trades t
        WHERE tl.stage = 1 AND t.id = tl.trade_id

        UNION ALL

        SELECT
            'SETTLEMENT'::text,
            s.settlement_date::timestamp,
            s.status::text
        FROM settlements s
        WHERE tl.stage = 2 AND s.trade_id = tl.trade_id

        UNION ALL

        SELECT
            'RECON_BREAK'::text,
            rb.detected_at,
            rb.status::text
        FROM recon_breaks rb
        WHERE tl.stage = 3 AND rb.trade_id = tl.trade_id

        UNION ALL

        SELECT
            'RESOLUTION'::text,
            COALESCE(rb.resolved_at, rb.detected_at),
            CASE WHEN rb.resolved_at IS NULL THEN 'OPEN' ELSE 'RESOLVED' END
        FROM recon_breaks rb
        WHERE tl.stage = 4 AND rb.trade_id = tl.trade_id
    ) AS nxt ON TRUE
    WHERE tl.stage < 5
)
SELECT trade_id, trade_ref, stage, stage_name, event_at, event_status
FROM trade_lifecycle
ORDER BY trade_id, stage;


-- ============================================================================
-- TICKET-ADV008 — REFRESH the daily-summary materialised view (concurrent so it can
--         run while the dashboard is reading it)
-- ============================================================================
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_recon_summary;


-- ============================================================================
-- TICKET-ADV009 — JSONB lookup: which instruments have sector = 'Technology'?
-- ============================================================================
SELECT symbol, metadata->>'sector' AS sector
FROM instruments
WHERE metadata @> '{"sector":"Technology"}'::jsonb;
