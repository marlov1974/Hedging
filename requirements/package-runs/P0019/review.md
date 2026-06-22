# P0019 consistency review

Package: `P0019-static-derivative-and-spot-actual-price-lists`

Result: `WARN`

## Evidence

- The existing Price API supports `PRICE_PROVIDER_MODE=fixture|real` in `src/price-api/providerMode.ts`.
- Existing price-provider types already include `NormalizedMarketPriceBlock`, `FuturesPriceProvider` and `BlockPriceProvider`.
- Existing seed data covers `2027-01` through `2029-12` and stores calendar `total_h` and `peak_h`.
- Existing seed portfolios use price area `SE3`, while the Price API type currently supports `STO`.

## Assumptions

- P0019 allows deterministic static PoC prices when exact current public derivative prices are not available.
- The static provider should keep the current Price API `STO` convention and document the `SE3` seed-data bridge.
- Spot actuals are synthetic PoC actuals derived from static derivative monthly reference prices.

## Conclusion

The package is implementable. The only warning is the existing `SE3` versus `STO` naming mismatch; implementation should avoid a broad Price API type migration in this package and document the bridge.
