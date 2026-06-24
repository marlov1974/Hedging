# P0039 Design

## Interpretation

The Data Viewer should demonstrate that one canonical portfolio can be inspected as raw source rows, derived customer-facing projections, and market/internal projection rows. Projected rows are output rows only and must not be confused with persisted canonical rows.

## Implementation Structure

- Extend Data Viewer table metadata with a view group id, label and short description.
- Add a `market-projection` table using `getMarketProjectionRows`.
- Add `component` and `component_concept` to raw transaction output.
- Mark Baseloads and Modern projected transaction rows with `component_concept: "projected"`.
- Update the Data Viewer UI copy and display the selected view group's description.
- Update Data Viewer docs and focused tests.

## Deliberate Non-Changes

- Do not change canonical transaction storage.
- Do not add persisted `modern.*` or `classic.*` rows.
- Do not alter Modern or Classic projection formulas.
- Do not add broad export or reporting features.

## Test Strategy

- Verify table metadata exposes raw canonical, projected customer and market/internal groups.
- Verify raw transaction rows show canonical concepts and do not emit `modern.*` or `classic.*`.
- Verify projected Modern rows remain projected and marked as such.
- Verify market projection excludes allocation components and carries a non-additive volume note.
- Verify the Data Viewer UI explains source-of-truth versus projected rows.

## Risks

- Adding columns can widen the mobile table. P0039 prioritizes clarity over visual redesign; existing table overflow behavior is retained.
- Market projection rows include sys and epad dimensions. A `dimension_note` explains that these are price dimensions and not additive physical customer volume.
