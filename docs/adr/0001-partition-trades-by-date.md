# ADR-0001 - Partition `trades` by `trade_date`

Status: Accepted | Date: 2026-07-27

## Context
ReconX will retain about 5 years of data at roughly 50,000 trades/day, which trends toward tens of millions of rows. Most reconciliation and dashboard queries filter by trade date windows.

## Decision
Use PostgreSQL RANGE partitioning on `trade_date` with monthly partitions plus a `trades_default` catch-all. Keep partition names as `trades_yYYYYmMM`.

## Consequences
Positive:
- Partition pruning reduces scanned data for date-bounded queries.
- Operational maintenance and archival become simpler by partition.
- Dashboard and matview refresh jobs are faster and more predictable.

Negative:
- Partition lifecycle requires operational discipline (create future partitions).
- SQL DDL complexity increases compared with a single table.
- Certain uniqueness constraints across all partitions become harder.

## Prompt used
Write an ADR in Michael Nygard format for partitioning `trades` by `trade_date` in PostgreSQL 16 for ReconX, considering 50k trades/day, 5-year retention, alternatives (single table, yearly partitions), and operational constraints.