# P0042 functions

## Changed constants

### `ANNUAL_BASE_PRICES`

- File: `src/price-api/staticDerivativePrices.ts`
- Purpose: Static annual PoC derivative reference levels for `base.sys` and `base.epad`.
- Change: Replace older manual-looking levels with public Euronext snapshot levels.
- Side effects: Derived quarterly/monthly static price blocks and static spot actual references change.
- Test coverage: `tests/price-api/staticDerivativePrices.test.ts` and full suite.

### `ANNUAL_TO_MONTH_FACTORS`

- File: `src/price-api/staticDerivativePrices.ts`
- Purpose: Schablon distribution key from annual derivative price to monthly derivative prices.
- Change: Add 12 monthly factors averaging 100% annually and calibrated against observed Euronext front-month/front-quarter/year relationships.
- Side effects: Static monthly blocks and static-mode monthly Price API rows become seasonal instead of flat.
- Test coverage: `tests/price-api/staticDerivativePrices.test.ts` and full suite.

### `PRICE_BY_COMPONENT`

- File: `src/database/pocSeedData.ts`
- Purpose: Seeded product configuration component prices.
- Change: Replace base/base.classic component prices with public Euronext snapshot levels.
- Side effects: Baseloads calloff lists, position reports and value-preserving projection prices change.
- Test coverage: Full suite.

### `combineSysAndEpadHedgePrice`

- File: `src/hedging/financialSettlement.ts`
- Purpose: Combine paired `base.sys` and `base.epad` settlement rows into one hedge price.
- Change: Round the combined hedge price to two decimals after weighted combination so exact public decimal fixtures do not leak JavaScript floating point artifacts into settlement output.
- Side effects: Financial settlement rows expose stable price precision.
- Test coverage: `tests/hedging/financialSettlement.test.ts` and full suite.

### `getWeightedComponentPrice`

- File: `src/hedging/financialSettlement.ts`
- Purpose: Calculate component-level weighted prices used by financial settlement.
- Change: Round the weighted component price to two decimals for the same fixture precision reason.
- Side effects: Settlement-only component price combination stays at EUR/MWh display precision.
- Test coverage: `tests/hedging/financialSettlement.test.ts` and full suite.

### `getMonthlyPrices`

- File: `src/price-api/priceApi.ts`
- Purpose: Return monthly component price rows for a requested month range.
- Change: Read monthly block prices when the configured provider exposes them, otherwise keep annual-price fallback behavior.
- Side effects: `PRICE_PROVIDER_MODE=static` returns seasonal monthly prices because the static provider exposes month blocks.
- Test coverage: `tests/price-api/staticDerivativePrices.test.ts`, `tests/price-api/priceApi.test.ts` and full suite.

## New functions

### `roundPrice`

- File: `src/hedging/financialSettlement.ts`
- Purpose: Keep settlement price outputs at two-decimal EUR/MWh precision.
- Inputs: A numeric price.
- Outputs: Price rounded to two decimals.
- Side effects: None.
- Reason: P0042 introduced exact public market prices with decimals, which exposed binary floating point artifacts in combined settlement prices.
- Test coverage: Covered through financial settlement expectations.

### `averageFactors`

- File: `src/price-api/staticDerivativePrices.ts`
- Purpose: Derive quarter factors from the monthly annual-to-month distribution key.
- Inputs: Month numbers as strings.
- Outputs: Arithmetic average of the configured month factors.
- Side effects: None.
- Reason: Keep quarter and month fixture generation aligned.
- Test coverage: Covered through static derivative quarter expectations.

### `monthlyComponentPrice`

- File: `src/price-api/priceApi.ts`
- Purpose: Prefer provider monthly block prices for `getMonthlyPrices` and fall back to annual prices.
- Inputs: Optional block provider, component code, month and annual price.
- Outputs: Monthly price.
- Side effects: None.
- Reason: Allow static mode to expose seasonal monthly prices while preserving existing annual fallback behavior.
- Test coverage: Covered through static provider-mode tests.

## Removed functions

None.
