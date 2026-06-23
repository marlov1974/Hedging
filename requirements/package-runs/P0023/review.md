# P0023 consistency review

Status: PASS

P0023 is consistent with the current prototype:

- Calloffs are stored with `portfolio_id`, so calloff rows can be scoped directly.
- Transactions are linked to portfolios through `transaction.calloff_id -> calloff.portfolio_id`.
- Product and component metadata is available in the current database maps and can enrich the raw rows while keeping IDs visible.
- The application configuration already controls per-portfolio feature visibility, so Data Viewer can be added to Baseloads and PeaksModern.

Implementation assumptions:

- Data Viewer is a read-only PoC/debug feature.
- The year selector includes years from relevant raw data plus calendar years, so seed years `2027`, `2028` and `2029` are available even before rows exist.
- Unknown table names are handled by showing a clear empty/error-style state rather than exposing unscoped data.
