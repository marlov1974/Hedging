# P0035 Design

## Interpretation

The main tool should read like one canonical demo portfolio with multiple feature-level projections. Portfolio and perspective must not feel like global product/package selectors.

## Implementation structure

- Default the UI to one demo portfolio.
- Remove the visible global portfolio selector.
- Remove the visible global perspective selector.
- Change the main feature navigation to generic labels.
- Add generic `calloff-list` and `position` feature ids.
- Render perspective tabs inside Forecast, Hedge Forecast, Calloff List, Position Report, Position and Data Viewer.
- Keep Hedge Baseload as a single feature without tabs.
- Use existing canonical data/projection helpers.

## Test strategy

- Update shell/application tests for the single portfolio UI and generic feature list.
- Add feature-rendering tests for internal perspective tabs.
- Keep existing P0030/P0032/P0033 projection tests passing.

## Risks

- Classic Forecast/Hedge Forecast remains a UI perspective over the current canonical/modern storage path, matching the PoC scope but not a full production Classic entry workflow.
- Position and Position Report share canonical aggregation output for now.
