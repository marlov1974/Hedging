# P0007 function design

## New functions

### `assertMonthString(value, fieldName)`

Purpose: validate `YYYY-MM` month input.
Inputs: unknown value and field name for error reporting.
Outputs: validated month string.
Side effects: none.
Reason: centralize request validation.
Tests: invalid month format rejection.

### `compareMonths(left, right)`

Purpose: compare two validated month strings chronologically.
Inputs: two month strings.
Outputs: negative, zero or positive number.
Side effects: none.
Reason: validate range ordering and support sorting logic.
Tests: end-before-start rejection and range generation.

### `expandMonthRange(startMonth, endMonth)`

Purpose: generate all inclusive months in a range.
Inputs: validated start and end months.
Outputs: ordered month strings.
Side effects: none.
Reason: produce monthly rows from annual fixture data.
Tests: one-month, full-year and cross-year requests.

### `yearFromMonth(month)`

Purpose: extract the calendar year from a month string.
Inputs: validated month string.
Outputs: year string.
Side effects: none.
Reason: select annual fixture data.
Tests: cross-year fixture selection and missing fixture data.

### `createPriceApi(providers)`

Purpose: create a local Price API service from provider implementations.
Inputs: futures and currency providers.
Outputs: object with `getMonthlyPrices(request)`.
Side effects: none.
Reason: keep core behavior independent from HTTP and provider details.
Tests: all Price API behavior tests.

### `createDefaultPriceApi()`

Purpose: create the v1 API with synthetic fixture providers.
Inputs: none.
Outputs: local Price API service.
Side effects: none.
Reason: provide a convenient prototype entry point.
Tests: covered through API behavior tests.

### `createPriceApiServer(api)`

Purpose: expose the core API through a minimal local HTTP server.
Inputs: Price API service.
Outputs: Node HTTP server.
Side effects: creates a server object; listening is caller-controlled.
Reason: provide an endpoint adapter without mixing HTTP logic into the core service.
Tests: not separately tested in P0007; core logic is covered directly.

## Removed functions

None.
