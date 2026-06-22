# P0015 review

## Classification

WARN

## Evidence

- `requirements/packages/P0015-seed-data-component-qfactor-poc.md` requests deterministic seed data, new portfolio-component instances and Q-factor tables.
- Existing database modules already support customers, portfolios, forecasts, calendars, product configurations, product components and price components.
- Existing component validation does not yet include P0015's classic and modern component codes, so validation must be extended.
- Existing `Calendar` rows use `calendar_id` as a technical primary key and `month` as a row attribute. P0015 asks to use calendar `CAL_SE_TRADING` and create 36 monthly rows.

## Scope decision

Proceed with implementation.

Calendar interpretation:

- Keep the existing `Calendar` table shape.
- Store monthly Swedish trading calendar rows with technical ids derived from `CAL_SE_TRADING` and month.
- Store portfolio `calendar_id` as `CAL_SE_TRADING` and update portfolio validation/query helpers to accept a calendar set prefix when exact id lookup is not available.

This avoids adding a separate calendar-set table that P0015 did not request.

## Public-safety result

All seed data will use synthetic customer names, synthetic prices and deterministic generated quantities only.
