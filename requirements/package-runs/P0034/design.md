# P0034 Design

## Interpretation

Build a universal model demonstration layer in the Hedging UI. The selected portfolio stays fixed while the user changes Baseloads, Classic and Modern perspectives.

## Implementation structure

- Add perspective identifiers and labels to `applicationConfig.ts`.
- Make application configuration perspective-driven instead of locked to portfolio product package.
- Add a perspective selector to the tool shell and preserve it through feature links and forms.
- Keep existing canonical transactions as source of truth.
- Extend Data Viewer table options so raw canonical rows and projected perspective rows are explicit.
- Relax projection list helpers so Classic and Modern projections can be shown from compatible canonical calloffs regardless of the portfolio's own product package metadata.
- Keep Modern Forecast and Hedge Forecast in P0033 modern terms.

## Refactoring decisions

- Reuse existing feature ids to avoid a larger router rewrite.
- Use perspective-specific labels in navigation and headings to make the matrix visible.
- Keep Hedge Baseload as a single feature variant.

## Test strategy

- Update application configuration tests for perspective-specific feature matrices.
- Add shell tests that perspective switching preserves portfolio id.
- Add Data Viewer tests for raw canonical, Baseloads projected, Classic projected and Modern projected views.
- Keep existing Modern Forecast/Hedge Forecast and calloff projection tests passing.

## Risks

- Classic Forecast/Hedge Forecast is presented as a perspective variant but uses the existing canonical/modern storage path for this PoC.
- Full production entitlement rules remain out of scope by package instruction.
