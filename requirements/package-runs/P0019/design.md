# P0019 implementation design

## Interpretation

P0019 adds deterministic static PoC price data for derivative blocks and spot actuals. The existing Price API should gain `PRICE_PROVIDER_MODE=static` while preserving fixture and real modes.

## Implementation structure

- Add `src/price-api/staticDerivativePrices.ts` with normalized derivative blocks and a provider class compatible with both annual and block provider contracts.
- Add `src/settlement/staticSpotActualPrices.ts` with monthly spot actual rows for `2027-01` through `2029-12`.
- Add `src/settlement/spotActuals.ts` with lookup and validation helpers for the next settlement report.
- Update `src/price-api/providerMode.ts` so `PRICE_PROVIDER_MODE=static` returns the static derivative provider and deterministic fixture currency.

## Intended changes

- Use static derivative blocks for `base.sys` and `base.epad`.
- Use `STO` as the Price API price area and document that this is the current PoC bridge for seed portfolios using `SE3`.
- Generate spot actuals from monthly static derivative references using deterministic peak/offpeak factors within `0.70` to `1.30`.
- Calculate monthly average spot from peak/offpeak using calendar hours.

## Test strategy

- Verify derivative block coverage and component coverage.
- Verify static provider mode in the Price API.
- Verify fixture mode still works.
- Verify spot actual coverage, weighted-average consistency, deterministic range, helper lookups and missing-month errors.

## Risks and uncertainty

- The static derivative list is PoC data, not production market data.
- `SE3`/`STO` mapping remains a documented prototype bridge rather than a full price-area model.
