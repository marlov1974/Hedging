# P0006 - Price API requirements

## Purpose

Define requirements for a Price API between the modelling solution and Market.

This is a requirements package. It may later become a coding package.

## Package type

Requirements package.

## Required work

Create or refine small documentation files:

```text
price_api_contract.md
price_api_sources.md
price_api_monthly_output.md
```

If documentation folders exist, place them under:

```text
docs/price-api/
```

If not, keep them in root and move them later.

## Scope v1

The first version supports:

- annual derivatives only,
- monthly output only,
- `base.sys`,
- `base.epad`,
- one supported EPAD area code: `STO`,
- one currency component: `SEK`.

## Request

The API request is:

```text
start_month
end_month
```

Both use `YYYY-MM` format.

## Response

The API returns one row per month:

```text
month
base.sys
base.epad
currency.sek
```

`base.sys` and `base.epad` are returned in EUR/MWh.

`currency.sek` is returned as a separate currency component. It must not be embedded in `base.sys` or `base.epad`.

## Source policy

The implementation must use provider adapters.

The source for futures prices may require a licensed or manually configured provider. The implementation must not hard-code credentials or private URLs.

The source for the SEK currency component should be configured as an adapter as well.

## Verification

Confirm that:

- no credentials are committed,
- no private URLs are committed,
- no real transaction data is committed,
- all example values are synthetic,
- output is monthly and deterministic for the same source data,
- `REPOSITORY_FILES.md` is updated if files are added or moved.
