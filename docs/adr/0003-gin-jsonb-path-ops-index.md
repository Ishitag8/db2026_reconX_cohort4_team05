# ADR-0003 - Use GIN `jsonb_path_ops` for metadata containment queries

Status: Accepted | Date: 2026-07-27

## Context
ReconX analytics frequently use containment predicates like `metadata @> '{"sector":"Technology"}'`. A B-tree index is not suitable for these JSONB operations.

## Decision
Create a GIN index on `instruments(metadata jsonb_path_ops)` to optimize containment lookups and keep index size smaller than generic JSONB indexing.

## Consequences
Positive:
- Significant speed-up for common `@>` filters.
- Lower index storage footprint than generic operator classes in this workload.
- Better responsiveness for search and dashboard filtering.

Negative:
- Operator-class choice is workload-specific and should be revisited if query patterns change.
- Some less-common JSON operations may need additional indexes.
- Adds index-maintenance overhead on writes.

## Prompt used
Write an ADR in Michael Nygard format for choosing GIN `jsonb_path_ops` index for `instruments.metadata` containment queries, compared to B-tree and default JSONB operator class.