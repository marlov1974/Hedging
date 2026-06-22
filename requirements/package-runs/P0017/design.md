# P0017 implementation design

## Package interpretation

P0017 wraps the Baseloads purchase feature in a broader hedging tool shell and adds a Baseloads calloff list for the active portfolio.

## Implementation structure

- `src/hedging/features.ts`: portfolio options and feature availability.
- `src/hedging/derivativeNames.ts`: market-style derivative name helper.
- `src/hedging/calloffList.ts`: component-split calloff list aggregation.
- `src/hedging/HedgingToolView.ts`: server-rendered shell UI.
- `src/hedging/server.ts`: local `node:http` server entry point.
- `tests/hedging/hedgingTool.test.ts`: shell and feature availability tests.
- `tests/hedging/baseloadsCalloffList.test.ts`: aggregation and naming tests.

## Intended behavior

- No selected portfolio: feature area asks the user to select a portfolio.
- Selected portfolio: UI shows portfolio name, customer name/number, price area and product configuration name when inferable.
- Baseloads portfolio: both features are available.
- Non-Baseloads portfolio: Baseloads features show a clear unavailable message.
- Baseloads calloff list: rows are split by component and aggregate all monthly transactions under the calloff/component.

## Aggregation rules

- `MWh = sum(transaction.mw * calendar.total_h)`.
- `Pris = sum(mwh_i * price_i) / sum(mwh_i)`.
- Price source is linked `PriceComponent` because transactions do not store price yet.

## Refactoring decisions

P0016 purchase business logic remains the source of calloff and transaction creation. The hedging shell calls it and does not duplicate transaction construction.

## Test strategy

Tests create the P0015 seed database, optionally run a P0016 quarter purchase, and assert feature availability, shell rendering, calloff list rows, MWh math, weighted prices and derivative names.

## Risks and uncertainties

- Derivative naming is market-style only, not exact public exchange naming.
- The UI is in-memory and local PoC only.
