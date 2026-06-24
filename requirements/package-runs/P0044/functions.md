# P0044 function design

## New functions

- `insertEvent(database, input)`
  - Purpose: persist validated generic events.
  - Inputs: `PrototypeDatabase`, `HedgingEvent`.
  - Output: inserted event.
  - Side effects: writes to `database.events`.
  - Tests: database event model tests.

- `insertEventDetail(database, input)`
  - Purpose: persist validated generic event details.
  - Inputs: `PrototypeDatabase`, `EventDetail`.
  - Output: inserted event detail.
  - Side effects: writes to `database.eventDetails`.
  - Tests: database event model tests.

- `createForecastEventDetailsForForecast(database, forecast)`
  - Purpose: create canonical price-area forecast event details from a compatibility forecast row, storing power as MW.
  - Inputs: database and `CustomerForecast`.
  - Output: created event and event details.
  - Side effects: inserts event rows.
  - Tests: seed and forecast event tests.

- `getCanonicalForecast(database, portfolioId, month)`
  - Purpose: derive forecast total MWh and peak percentage from canonical forecast event details using calendar hours.
  - Inputs: database, portfolio id, month.
  - Output: forecast-like values.
  - Side effects: none.
  - Tests: Forecast and Hedge Forecast tests.

- `syncForecastEventDetails(database, forecast)`
  - Purpose: update forecast event details after Forecast feature edits.
  - Inputs: database and updated forecast.
  - Output: synced event/details.
  - Side effects: replaces old forecast event details for the event.
  - Tests: Forecast update tests.

- `createPurchaseEventForCalloff(database, input)`
  - Purpose: mirror accepted hedge purchases into event/event_detail form.
  - Inputs: calloff and generated transactions.
  - Output: created purchase event and event details.
  - Side effects: inserts event rows.
  - Tests: Hedge Forecast purchase event tests.

## Changed functions

- `createSchema`
  - Adds `events` and `eventDetails` maps.

- `insertCustomerForecast`
  - Remains a compatibility insert. Forecast event creation is kept explicit in seed/update helpers to avoid requiring calendars before forecast insert.

- `getForecastRowsForYear`, `buildForecastHedgeProfile`, `acceptForecastHedgeProfile`
  - Read forecast through canonical forecast event helpers and preserve compatibility fallbacks.

- `getDataViewerTables`, `getDataViewerRows`
  - Add forecast event and projected forecast tables.

## Removed functions

None.

## Addendum - price-area percent hedge functions

- `getCanonicalForecastForPriceArea(database, portfolioId, month, priceArea)`
  - Purpose: derive selected-area forecast MWh and peak percentage from canonical forecast event details.
  - Inputs: database, portfolio id, month, price area.
  - Output: forecast-like values for the selected area.
  - Side effects: none.
  - Tests: Forecast Hedge selected-area profile tests.

- `normalizePriceArea(value)`
  - Purpose: validate and normalize supported synthetic price-area input.
  - Inputs: string-like price area.
  - Output: supported price area.
  - Side effects: none.
  - Tests: Forecast Hedge validation tests.

- `eventDetailsForTransaction(...)`
  - Change: honors transaction `price_area` when present and emits selected-area event details only.
  - Reason: percent-of-forecast purchases must not implicitly allocate across every area.
