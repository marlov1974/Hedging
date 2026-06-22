# P0009 function design

## New functions

### `validateProfilePriceRequest(request)`

Purpose: validate v2 price area and monthly MW profile.
Inputs: unknown request.
Outputs: normalized request with months sorted chronologically.
Side effects: none.
Reason: centralize v2 request validation.
Tests: unsupported price area, duplicate month, non-contiguous profile and negative MW tests.

### `createFixtureBlockPriceProvider(fixtures)`

Purpose: provide synthetic year, quarter and month blocks for a component, price area and period.
Inputs: optional fixture block list.
Outputs: `BlockPriceProvider`.
Side effects: none.
Reason: make future real providers pluggable while keeping v2 synthetic.
Tests: stacking and missing data tests.

### `resolveBlock(provider, component, area, blockType, period, widerBlock)`

Purpose: return a direct or virtual block for stacking.
Inputs: block provider, component, price area, block type, period and optional wider source.
Outputs: priced block or undefined.
Side effects: none.
Reason: implement virtual quarter/month generation without hiding source trace.
Tests: virtual quarter and virtual month trace tests.

### `calculateProfileComponentRows(request, providers)`

Purpose: calculate compact monthly response rows and trace entries for v2.
Inputs: normalized v2 request and providers.
Outputs: response rows and trace entries.
Side effects: none.
Reason: keep stacking independent from HTTP and API object wiring.
Tests: all v2 price and trace tests.

### `createPriceApi(...).getProfilePrices(request)`

Purpose: expose compact v2 response.
Inputs: v2 request.
Outputs: `PriceApiResponse`.
Side effects: none.
Reason: main package entry point for v2.
Tests: compact response tests.

### `createPriceApi(...).getProfilePricesWithTrace(request)`

Purpose: expose v2 response with trace for diagnostics.
Inputs: v2 request.
Outputs: compact response plus trace.
Side effects: none.
Reason: satisfy P0009 trace requirement without changing compact response.
Tests: virtual block trace tests.

## Changed functions

### `createPriceApi(providers)`

Change: accepts optional v2 block provider while preserving existing v1 providers and behavior.
Reason: extend API without breaking P0007.
Tests: existing v1 tests plus new v2 tests.

### `createPriceApiServer(api)`

Change: supports `POST /price-api/profile`.
Reason: provide local endpoint adapter for v2.
Tests: core logic is tested directly; server remains a thin adapter.

## Removed functions

None.
