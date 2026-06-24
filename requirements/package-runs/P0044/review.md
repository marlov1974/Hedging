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
- Forecast event details use `quantity_type = MWh`; purchase event details use the existing normalized transaction quantity fields, usually `MW`.
- SYS purchase event details are split across supported synthetic price areas so each SYS detail has `price_area`.
- The supported price areas are synthetic public-safe model values: `STO`, `MAL`, `LUL`, `SUN`.

No real customer names, company names, internal product names, real forecasts, real prices or confidential terms are introduced.
