# P0045 function design

## New functions

- `buildBaseloadsPositionReportRowsFromTransactions(database, transactions)`
  - Purpose: project transaction rows into compressed monthly Baseloads report rows.
  - Inputs: database and customer transactions.
  - Output: rows with reportable base volume, hedge value and effective hedge price.
  - Side effects: none.
  - Tests: Position Report tests.

- `rebalanceBaseloadsToForecast(database, input)`
  - Purpose: create a signed Baseloads calloff that moves the Baseloads position toward target percentage of selected-area base forecast.
  - Inputs: portfolio id, period, price area, target percentage, optional date/calloff id.
  - Output: calloff, transactions, target, current volume, delta and derivative names.
  - Side effects: inserts calloff and transaction rows when delta is non-zero.
  - Tests: Baseloads rebalance tests.

## Changed functions

- `getBaseloadsPositionReportRows`
  - Uses the new Baseloads projection so peak value contributes to effective hedge price while peak volume stays excluded.

- `getBaseloadsCalloffListRows`
  - Uses stored rebalance derivative names for P0045 rebalance rows.

## Removed functions

None.
