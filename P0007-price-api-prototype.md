# P0007 - Price API prototype

## Purpose

Implement a local Price API prototype.

The API returns monthly component prices for a requested month range.

## Package type

Code package.

## Prerequisites

P0001 through P0006 are expected to be complete.

If package files or documentation are still in root, continue only if the active repo state is consistent enough to implement safely. Otherwise stop with `STOP` and report what must be cleaned first.

## Scope v1

Implement v1 only:

- annual derivatives only,
- monthly output only,
- `base.sys`,
- `base.epad`,
- one supported EPAD area code: `STO`,
- `currency.sek` as separate component,
- synthetic fixture provider only,
- no real external calls,
- no credentials,
- no private URLs.

## API request

Input:

```json
{
  "start_month": "2027-01",
  "end_month": "2027-12"
}
```

Both months are inclusive.

## API response

Output:

```json
{
  "base_currency": "EUR",
  "price_unit": "EUR/MWh",
  "rows": [
    {
      "month": "2027-01",
      "base.sys": 0.0,
      "base.epad": 0.0,
      "currency.sek": 0.0
    }
  ]
}
```

A full-year request must return 12 monthly rows.

## V1 pricing rule

V1 uses annual derivative fixture data.

For each month, select the annual value for that month's year.

Example rule:

```text
2027 annual base.sys -> every month in 2027
2027 annual base.epad -> every month in 2027
2027 annual currency.sek -> every month in 2027
```

Do not use zero for missing data unless the fixture explicitly provides zero.

## Required implementation

Use TypeScript.

Create or update a minimal local project structure as appropriate.

Suggested structure:

```text
src/price-api/types.ts
src/price-api/monthRange.ts
src/price-api/providers.ts
src/price-api/priceApi.ts
src/price-api/server.ts
tests/price-api/*.test.ts
```

The exact structure may differ if the repository already has a better convention.

## Provider design

Implement provider interfaces:

```text
FuturesPriceProvider
CurrencyProvider
```

Use synthetic fixture providers for v1:

```text
FixtureFuturesPriceProvider
FixtureCurrencyProvider
```

The implementation must make it clear where future real providers would plug in, without adding real providers now.

## Required behavior

- Validate `start_month` and `end_month` format as `YYYY-MM`.
- Reject end month before start month.
- Return one row for each inclusive month.
- Support ranges crossing year boundaries if fixture data exists for each year.
- Return explicit missing-data errors when fixture data is missing.
- Keep `base.sys` and `base.epad` in EUR/MWh.
- Keep `currency.sek` separate from energy component prices.

## Tests

Add tests for:

1. one-month request returns one row,
2. full-year request returns 12 rows,
3. cross-year request uses each year's fixture values,
4. invalid month format is rejected,
5. end before start is rejected,
6. missing annual fixture data is rejected,
7. `currency.sek` is present and separate,
8. no component price is changed by the currency component.

## Verification

Run the relevant test command.

Also run:

```bash
git status --short
git diff --check
```

If package implementation adds or moves files, update `REPOSITORY_FILES.md` so it matches `git ls-files`.

## Completion report

Report:

- files changed,
- tests run,
- test result,
- endpoint or function entry point,
- any assumptions,
- `REPOSITORY_FILES.md` status.
