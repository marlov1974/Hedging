# P0016 function design

## New functions

### `getBaseloadsPurchasePeriods()`

- Purpose: return deterministic year, quarter and month period options.
- Inputs: none.
- Output: `PurchasePeriodOption[]`.
- Side effects: none.
- Reason: P0016 period dropdown.
- Test coverage: exact counts and labels.

### `expandPeriodMonths(period)`

- Purpose: expand a period option into monthly `YYYY-MM` values.
- Inputs: period option.
- Output: string array.
- Side effects: none.
- Reason: transaction creation is month-based.
- Test coverage: month, quarter and year transaction counts.

### `createBaseloadsCalloff(database, input)`

- Purpose: validate Baseloads product/portfolio and insert one call-off.
- Inputs: database, portfolio id, date and optional id generator.
- Output: inserted `Calloff`.
- Side effects: mutates `database.calloffs`.
- Reason: required function.
- Test coverage: call-off count and invalid portfolio rejection.

### `createBaseloadsTransactions(database, input)`

- Purpose: create monthly `base.sys` and `base.epad` transactions for a call-off.
- Inputs: database, call-off, period, MW and optional id generator.
- Output: created transactions.
- Side effects: mutates `database.transactions`.
- Reason: required function.
- Test coverage: 2/6/24 transaction counts, component pairing, MW and Q-factor values.

### `purchaseBaseloads(database, input)`

- Purpose: orchestrate a purchase.
- Inputs: database, portfolio id, MW, period id, date and optional id generators.
- Output: purchase result containing call-off, transactions and period.
- Side effects: mutates call-off and transaction maps.
- Reason: UI and tests should use one business entry point.
- Test coverage: success and validation errors.

### `renderBaseloadsPurchaseForm(input)`

- Purpose: render the professional purchase form.
- Inputs: portfolio label, periods, optional error/result state.
- Output: HTML string.
- Side effects: none.
- Reason: user-facing UI without adding a frontend framework.
- Test coverage: form and successful result rendering.

### `createBaseloadsPurchaseServer(database)`

- Purpose: expose the form and purchase action over HTTP.
- Inputs: optional database.
- Output: Node HTTP server.
- Side effects: network listener when caller starts the server.
- Reason: simple local web interface.
- Test coverage: UI renderer is covered directly; server follows existing `node:http` pattern.

## Changed functions

None.

## Removed functions

None.
