# P0028 Design

## Package Interpretation

Split the canonical allocation helper row into sys and epad dimensions while preserving compatibility with old unsuffixed rows.

The new Peaks forecast hedge monthly row set is:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

## Implementation Structure

1. Extend canonical component metadata with `allocation.peak.sys` and `allocation.peak.epad`.
2. Keep `allocation.peak` as a deprecated alias where existing rows need to be interpreted.
3. Update seed data component sets, prices and q-factor ranges to write split allocation components.
4. Update Forecast Hedge transaction generation from five to six rows per month.
5. Update Legacy Calloff List to derive one effective allocation peak MW from split rows, warn on mismatch, and fall back to old unsuffixed rows when split rows are absent.
6. Update tests and durable docs.

## Deliberate Scope Boundaries

- No product package hierarchy redesign.
- No rename of `peak.sys` / `peak.epad`.
- No settlement or Modern Projection UI changes.
- No change to raw Data Viewer filtering beyond the new stored rows appearing naturally.

## Test Strategy

- Update seed-data tests for split allocation components, q-factor zero, price zero and projection categories.
- Update Forecast Hedge tests for six monthly rows, example values and market projection exclusion.
- Update Legacy Calloff List tests for split allocation rows, mismatch warning and old alias fallback.
- Run full `npm test`, `git diff --check`, and file-index verification.

## Risks

- `allocation.peak` cannot be a one-to-one canonical alias to both split codes in the current string normalizer, so compatibility will be implemented at read sites and documented explicitly.
- Q-factor ids shift for generated seed components because the component list grows by one row; tests should avoid relying on brittle id offsets where possible.
