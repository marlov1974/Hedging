# P0046 function design

## New functions

- `isRequestAuthorized(request, password)`
  - Purpose: decide whether a request has valid Basic Auth for the configured password.
  - Inputs: Node incoming request and password string.
  - Output: boolean.
  - Side effects: none.
  - Tests: Hedging server auth tests.

- `writeUnauthorized(response)`
  - Purpose: return a Basic Auth challenge.
  - Inputs: Node server response.
  - Output: none.
  - Side effects: writes HTTP 401 response.
  - Tests: Hedging server auth tests.

## Changed functions

- `createHedgingToolServer`
  - Reads `HEDGING_PASSWORD` at server creation and enforces Basic Auth when it is set.

## Removed functions

None.
