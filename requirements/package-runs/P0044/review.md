# P0044 consistency review

Status: WARN

P0044 is consistent with the current direction from P0037-P0043: canonical data is source of truth and Classic/Modern are projections.

The package is intentionally broad. A full rename of all existing `calloff` and `transaction` code to `event` and `event_detail` in one step would be larger than the package can safely complete without destabilizing existing projected reports. The implementable interpretation is therefore:

- add explicit `event` and `event_detail` source-of-truth structures,
- store forecast source data as `FORECAST` events with price-area event details,
- mirror new hedge accepts as `PURCHASE` events/event details while keeping the existing calloff/transaction compatibility layer,
- add explicit price-area component codes for forecast/event detail usage,
- keep generic EPAD rows as compatibility transaction components until later packages migrate purchase storage fully.

Assumptions:

- `base.epad`, `peak.epad` and `allocation.peak.epad` remain accepted compatibility components for existing purchase/report tests.
- Forecast event details use `quantity_type = MW`; forecast MWh is derived from component hour basis and calendar hours. Purchase event details use the existing normalized transaction quantity fields, usually `MW`.
- SYS purchase event details are split across supported synthetic price areas so each SYS detail has `price_area`.
- The supported price areas are synthetic public-safe model values: `STO`, `MAL`, `LUL`, `SUN`.

No real customer names, company names, internal product names, real forecasts, real prices or confidential terms are introduced.

## Addendum - price-area percent hedge

Status: WARN

The updated P0044 package adds a mandatory price-area selection for percent-of-forecast hedge purchases. This is consistent with the current event/detail direction, but it is a scoped follow-up because the first P0044 implementation already established event details and MW forecast storage.

Implementation interpretation:

- percent-of-forecast profile generation and accept require one explicit supported price area,
- generated forecast basis is the selected area forecast only,
- compatibility transaction rows carry `price_area` so purchase event details do not implicitly expand to all areas,
- SYS purchase details keep `base.sys` / `peak.sys` component codes but use the selected `price_area`,
- area-side EPAD compatibility rows become selected-area event details such as `base.sto` and `peak.sto`.

Deferred beyond this addendum:

- richer UI for separate SYS and area percentages. The function input accepts separate percentages with current percentage as fallback; the visual form still uses one percentage field.
