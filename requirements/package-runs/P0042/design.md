# P0042 design

## Interpretation

Replace old manual-looking PoC base price levels with public Euronext Nord Pool Power Futures snapshot values.

## Implementation structure

- `src/price-api/staticDerivativePrices.ts`
  - Update annual base.sys/base.epad static fixture levels.
  - Rename the static source label to make clear it is a public Euronext snapshot fixture.
  - Add annual-to-month distribution factors and derive quarter factors from the same monthly key.
- `src/price-api/priceApi.ts`
  - Use provider monthly blocks in `getMonthlyPrices` when a selected provider exposes them.
  - Fall back to annual prices when no monthly block provider is supplied.
- `src/database/pocSeedData.ts`
  - Update seeded base component price values used by demo product configurations.
- Tests
  - Update exact expected values that assert the changed fixture levels and monthly distribution behavior.
- Settlement precision
  - Round combined settlement hedge prices to two decimals so public decimal fixtures do not expose JavaScript floating point artifacts.
- Docs/evidence
  - Record source check and public-safety handling.

## Refactoring decisions

No broad refactor. This package only changes values and labels around price fixtures.

## Test strategy

Run the full Node test suite because the base price constants affect calloff lists, position reports, settlement, projected prices and static spot actuals.

## Risks

The public Euronext snapshot is dynamic. The committed values are a small PoC fixture observation, not an operational data feed. Customer-specific, contract-specific and internally agreed prices remain out of scope.

The single annual-to-month percentage key is calibrated on Nordic System Price base-load observations. EPAD can need a separate shape key later because EPAD prices are area differentials and may be negative.
