# ADR-0002 — Use JSONB for schema-flexible instrument metadata

- Status: Accepted
- Date: 2026-06-02
- Deciders: ReconX team

## Context

Instruments in the ReconX platform represent various asset classes (Equity, Fixed Income, FX, Commodity, Derivative). Each asset class requires distinct attributes (e.g., Equity requires sector/exchange; Fixed Income requires tenor/issuer; FX requires currency pair). Storing these in a fixed relational model results in sparse columns, high null counts, and constant DDL changes as new asset classes are onboarded.

## Decision

Use PostgreSQL's `JSONB` data type to store schema-flexible attributes in a single `metadata` column on the `instruments` table. This allows dynamic schema structures per asset class without requiring DDL alterations.

## Consequences

**Positive**
- High flexibility: onboarding new asset classes requires zero database schema changes.
- Simplified entity mapping: reduces relational table bloat (e.g. Entity-Attribute-Value pattern).
- Native query support: PostgreSQL supports indexing and querying JSONB data efficiently.

**Negative**
- Lack of strict schema validation at the database layer (must be enforced by the application).
- Higher storage overhead per row compared to compact primitive columns.

---

## Generator Prompt
```text
You are an enterprise software architect. Write an Architecture Decision Record (ADR) in the Michael Nygard format (Title, Status, Context, Decision, Consequences) for the following decision.

System: ReconX, a near-prod trade reconciliation platform.
Stack: PostgreSQL 16, Spring Boot 3, Kafka, React.
Scale: ~50,000 trades/day, 5-year retention, 10 concurrent recon analysts.

Decision to record: Use JSONB for schema-flexible instrument metadata

Alternatives we considered:
- Entity-Attribute-Value (EAV) table pattern
- Sparse columns with NULL values on main instruments table

Constraints / forces:
- Dynamic instrument attributes per asset class
- Prevent frequent DDL modifications for new asset classes
- Support fast queries on metadata attributes

Format: Markdown, Nygard 5-section template, no fluff. Keep under 300 words.
Include a "Status: Accepted | Date: 2026-06-02" line.
```
