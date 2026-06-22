# P0014 function design

## New functions

### `assertDate(value, fieldName)`

- Purpose: validate ISO call-off dates.
- Inputs: string value and field name.
- Output: none.
- Side effects: throws `DatabaseError` on invalid input.
- Reason: P0014 requires `YYYY-MM-DD` date validation.
- Test coverage: invalid call-off date rejection.

### `insertCalloff(database, input)`

- Purpose: insert a call-off row.
- Inputs: prototype database and `Calloff`.
- Output: inserted `Calloff`.
- Side effects: mutates `database.calloffs`.
- Reason: required repository function for Calloff table.
- Test coverage: valid insert, unknown product, unknown portfolio, invalid date.

### `insertTransaction(database, input)`

- Purpose: insert a monthly component transaction row.
- Inputs: prototype database and `CustomerTransaction`.
- Output: inserted `CustomerTransaction`.
- Side effects: mutates `database.transactions`.
- Reason: required repository function for Transaction table.
- Test coverage: valid insert, unknown call-off, unknown component, invalid month, missing/non-numeric `mw`, missing/non-numeric `q_factor`, product consistency.

### `getCalloffWithTransactions(database, calloffId)`

- Purpose: return one call-off with its transaction rows.
- Inputs: prototype database and call-off id.
- Output: `CalloffWithTransactions` or `undefined`.
- Side effects: none.
- Reason: package-suggested access function.
- Test coverage: returns call-off with transaction rows.

### `getTransactionsByPortfolio(database, portfolioId)`

- Purpose: return transactions whose parent call-off belongs to a portfolio.
- Inputs: prototype database and portfolio id.
- Output: sorted `CustomerTransaction[]`.
- Side effects: none.
- Reason: package-suggested access function.
- Test coverage: portfolio query case.

### `getTransactionsByProduct(database, productId)`

- Purpose: return transactions whose parent call-off belongs to a product.
- Inputs: prototype database and product id.
- Output: sorted `CustomerTransaction[]`.
- Side effects: none.
- Reason: package-suggested access function.
- Test coverage: product query case.

## Changed functions

### `createSchema()`

- Purpose: create empty in-memory database maps.
- Change: initialize `calloffs` and `transactions`.
- Test coverage: existing schema creation plus P0014 inserts.

## Removed functions

None.
