# ADR-0003 — Use GIN index with `jsonb_path_ops` for containment queries

- Status: Accepted
- Date: 2026-06-02
- Deciders: ReconX team

## Context

We use a `JSONB` column to store schema-flexible attributes on the `instruments` table. Recon analyst workflows require querying these instruments based on metadata matches (e.g., finding all instruments in a specific sector or with a specific issuer). Standard B-Tree indexes cannot index key-value paths inside JSONB documents, and a default GIN index (`jsonb_ops`) has a larger storage footprint because it indexes every key and value.

## Decision

Create a Generalized Inverted Index (GIN) using the `jsonb_path_ops` operator class on the `metadata` column of the `instruments` table.

## Consequences

**Positive**
- Query optimization: speeds up containment queries (e.g. `@>`) significantly.
- Storage efficiency: `jsonb_path_ops` indexes only hash values of paths/values, resulting in a much smaller index size than the default `jsonb_ops`.
- Lower maintenance overhead during write operations.

**Negative**
- Less flexible: does not support indexing key existence checks (e.g. `?` operator), only full containment checks.

---

## Generator Prompt
```text
You are an enterprise software architect. Write an Architecture Decision Record (ADR) in the Michael Nygard format (Title, Status, Context, Decision, Consequences) for the following decision.

System: ReconX, a near-prod trade reconciliation platform.
Stack: PostgreSQL 16, Spring Boot 3, Kafka, React.
Scale: ~50,000 trades/day, 5-year retention, 10 concurrent recon analysts.

Decision to record: Use GIN index with jsonb_path_ops for containment queries on instrument metadata

Alternatives we considered:
- Standard B-Tree index (not supported for arbitrary JSON fields)
- Default GIN index (jsonb_ops)

Constraints / forces:
- Fast query responses on metadata attributes (containment query @>)
- Minimize database index storage footprint
- Optimize write/update latency on instruments table

Format: Markdown, Nygard 5-section template, no fluff. Keep under 300 words.
Include a "Status: Accepted | Date: 2026-06-02" line.
```
