# P0016 implementation design

## Package interpretation

P0016 adds a Baseloads purchase flow for the synthetic Baseloads portfolio. A purchase creates one call-off and two transaction rows per month: one for `base.sys` and one for `base.epad`.

## Implementation structure

- `src/purchase/periodOptions.ts`: deterministic period option creation and month expansion.
- `src/purchase/baseloadsPurchase.ts`: business logic for validation, call-off creation and transaction creation.
- `src/purchase/BaseloadsPurchaseView.ts`: HTML rendering for the form and result view.
- `src/purchase/server.ts`: minimal `node:http` server with GET form and POST purchase handling.
- `tests/purchase/baseloadsPurchase.test.ts`: business and UI rendering tests.

## Business logic

The purchase logic will:

1. find the Baseloads product configuration,
2. validate the selected portfolio is the Baseloads seed portfolio,
3. find `base.sys` and `base.epad` product components,
4. expand the selected period into months,
5. create one call-off,
6. read Q-factor values from the linked portfolio product component and Q-factor set for each component/month,
7. create one transaction per month/component.

## UI design

Use server-rendered HTML with restrained styling:

- portfolio field limited to the Baseloads portfolio,
- MW numeric input,
- period dropdown,
- confirmation button,
- post-purchase summary with call-off id and transaction count.

No authentication, sessions or persistent storage are added.

## Refactoring decisions

No existing database types are changed. The purchase module composes existing repository functions.

## Test strategy

Tests cover required period counts, transaction counts, component pairing, MW/q-factor values, validation errors, and rendered HTML for form/result states.

## Risks and uncertainties

- The fourth full year option, 2030, is deterministic but not covered by P0015 seed Q-factor values. This is intentionally left as a validation failure if purchased.
- The UI is a PoC local web interface and stores data in an in-memory database for the server process lifetime.
