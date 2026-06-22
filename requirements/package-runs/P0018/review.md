# P0018 review

## Classification

PASS

## Evidence

- `requirements/packages/P0018-hedging-tool-minimal-layout-and-position-report.md` is a coding package.
- P0017 already has a hedging shell, feature navigation and Baseloads calloff list.
- Existing transaction, calendar and price component data are enough to calculate monthly component positions.
- P0018 requires UI layout changes and new report logic only; no schema change is required.

## Scope decision

Proceed with:

- compact hedging shell layout,
- new `Portfolio Details` feature,
- new `Position Report` feature,
- calloff list visible column change,
- tests and documentation.

## Assumptions

- Position report uses all transactions under calloffs for the selected portfolio.
- Price source remains linked `PriceComponent` because transactions do not store price yet.
- Years come from seed calendar years plus transaction years, which gives 2027, 2028 and 2029 for the current PoC.
