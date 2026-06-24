# P0041 Design

## Interpretation

P0041 introduces a normalized currency layer while preserving the current in-memory PoC schema compatibility. Power rows remain MW/EUR-per-MWh/Q-factor rows. Currency rows carry EUR amount and SEK-per-EUR rate through new generic transaction fields.

## Implementation Structure

- Extend portfolio and transaction types with optional currency/normalized transaction fields.
- Seed `currency = "SEK"` for demo portfolios.
- Add `currency.eursek` to canonical component metadata.
- Add currency component rows to Peaks product configurations and q-factor structures where useful for SEK demo purchase flows.
- Add helper functions for normalized transaction economics:
  - derived power MWh/value
  - currency SEK value
  - SEK commercial base calloff normalization
- Add explicit Classic and Modern purchase helpers that take purchased MWh inputs and write canonical power rows plus currency rows for SEK portfolios.
- Keep reports/projections power-only by relying on component category filtering and by ignoring non-power rows in position/calloff helpers.

## Deliberate Non-Changes

- Do not source real FX rates.
- Do not remove existing percentage-based forecast UI in this package.
- Do not remove `mw` and `q_factor` compatibility fields.
- Do not store derived MWh/value as source-of-truth fields.

## Test Strategy

- Database/model tests for currency and normalized fields.
- Component-code tests for `currency.eursek`.
- Currency normalization tests for SEK commercial power + currency legs.
- Forecast hedge tests for explicit Classic/Modern purchase helpers.
- Market projection test ensuring currency is excluded.
- Full `npm test`.

## Risks

- Currency rows sharing `CustomerTransaction` require compatibility placeholders for legacy numeric fields. The normalized fields are the authoritative fields for currency economics.
- Explicit purchase helpers may initially be model-level APIs rather than full UI flows.
