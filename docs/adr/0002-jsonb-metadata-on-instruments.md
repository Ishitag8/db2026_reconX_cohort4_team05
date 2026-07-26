# ADR-0002 - Store instrument metadata in JSONB

Status: Accepted | Date: 2026-07-27

## Context
Instrument attributes vary by asset class and evolve quickly. Creating rigid columns for all potential metadata would cause frequent schema changes and sparse tables.

## Decision
Add `instruments.metadata` as `JSONB NOT NULL DEFAULT '{}'::jsonb` and keep core searchable identifiers (`symbol`, `isin`, `asset_class`) as first-class columns.

## Consequences
Positive:
- Faster delivery for new metadata without repeated DDL migrations.
- Better fit for heterogeneous attributes across equities, FX, and derivatives.
- Works naturally with PostgreSQL JSON operators for rich filtering.

Negative:
- Validation moves partly into application logic.
- Query readability can degrade without naming discipline on JSON keys.
- Incorrectly indexed JSON queries can regress performance.

## Prompt used
Write an ADR in Michael Nygard format for adding JSONB `metadata` to `instruments` in ReconX, considering flexible schema needs across asset classes and alternatives (wide table, EAV table).