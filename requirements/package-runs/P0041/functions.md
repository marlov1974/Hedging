# P0041 Function Design

## Changed Types

### `CustomerPortfolio`

- Add `currency?: string`.
- Purpose: customer-facing/reporting portfolio currency.

### `CustomerTransaction`

- Add optional normalized fields:
  - `quantity`
  - `quantity_type`
  - `price`
  - `price_type`
  - `factor`
  - `factor_type`
- Purpose: support power and currency rows in one compatibility model.

## Changed Functions

### `insertCustomerPortfolio`

- Validate/default portfolio currency.

### `insertTransaction`

- Validate normalized transaction fields when present.

### `createPocSeedData`

- Seed demo portfolios with `SEK`.
- Add `currency.eursek` product/q-factor metadata where required.

### `isMarketProjectionComponent`

- Existing category-based behavior should exclude currency rows; tests will cover this.

## New Functions

### `derivePowerTransactionEconomics`

- Inputs: transaction, component, calendar, price fallback.
- Outputs: MWh, raw EUR value, q-factor adjusted EUR value.

### `deriveCurrencyTransactionEconomics`

- Inputs: currency transaction.
- Outputs: EUR quantity, SEK-per-EUR rate, SEK value.

### `normalizeSekCommercialPowerLeg`

- Inputs: MWh, SEK amount, FX rate, period hours, q-factor.
- Outputs: normalized EUR power quantity/price plus currency leg quantity/price.

### `createExplicitClassicHedgePurchase`

- Inputs: portfolio, month, offpeak/peak MWh, prices and FX.
- Side effect: creates canonical Classic power rows and a currency row for SEK portfolios.

### `createExplicitModernHedgePurchase`

- Inputs: portfolio, month, base/peak MWh, prices and FX.
- Side effect: creates canonical Modern power rows and a currency row for SEK portfolios.
