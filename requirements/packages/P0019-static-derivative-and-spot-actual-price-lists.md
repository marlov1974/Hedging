# P0019 - Static derivative and spot actual price lists

## Purpose

Create static PoC price data that the Price API and upcoming settlement report can use.

This package adds:

1. a static derivative price list,
2. a static spot-price actual list,
3. provider wiring so the existing Price API can read the static derivative list,
4. enough spot actual data to support immediate settlement reporting in the PoC.

This is a coding/data package.

## Context

Earlier packages added fixture and real-provider abstractions. Real futures integration may not have direct open market data. For this PoC, static price snapshots are acceptable.

The next planned step is a settlement report. Therefore we need both traded derivative prices and actual spot prices for the same periods.

## Scope

Create static price data for the seeded period:

```text
2027-01 through 2029-12
```

Use available public derivative prices if Codex can find them safely. If exact current derivative prices cannot be found, create a deterministic static PoC list based on plausible derivative levels.

Spot actual prices may be based on static derivative prices with deterministic random variation of plus/minus 30 percent.

The prices are PoC data, not production market data.

## Static derivative price list

Create a static derivative price list for at least:

```text
base.sys
base.epad
```

For price area:

```text
SE3 or STO, following the repository's existing convention
```

If the current code uses `STO`, continue to support `STO`. If seed data uses `SE3`, document and bridge the mapping explicitly.

The list should contain normalized block records compatible with the existing futures provider shape:

```text
component
price_area
block_type
block_id
start_month
end_month
price
currency
price_unit
retrieved_at
source_name
source_instrument
```

Required block types:

```text
year
quarter
month
```

Minimum coverage:

```text
4 years
11 quarters
6 months
```

Prefer coverage aligned with the existing Baseloads purchase dropdown.

## Spot-price actual list

Create a static spot actual list in monthly resolution.

The spot actual list must contain three linked prices per month and price area:

```text
monthly_average_price
peak_price
offpeak_price
```

Required fields:

```text
month
price_area
monthly_average_price
peak_price
offpeak_price
currency
price_unit
source_name
source_method
```

For this PoC, create spot actuals for the relevant system/base market exposure. If component-level spot actuals are easier to keep consistent with existing code, support `base.sys` first and document the limitation.

## Spot actual consistency rule

Spot monthly average must be the hour-weighted average of peak and offpeak prices.

Use calendar hours:

```text
monthly_average_price = (peak_price * peak_h + offpeak_price * offpeak_h) / (peak_h + offpeak_h)
```

where:

```text
peak_h = calendar peak hours for the month
offpeak_h = calendar total_h - peak_h
```

Do not create independent random values for all three fields. Generate or choose peak and offpeak, then calculate monthly average from the formula.

Tests must verify this formula for every generated month.

## Spot actual generation rule

Use derivative prices as reference where possible.

For each month, generate deterministic variation around the relevant derivative reference price.

Allowed range:

```text
0.70 to 1.30
```

Example approach:

```text
monthly_reference = static derivative monthly price
peak_price = monthly_reference * deterministic_peak_factor
offpeak_price = monthly_reference * deterministic_offpeak_factor
monthly_average_price = weighted average from peak/offpeak and calendar hours
```

The factor must be deterministic, not true random, so tests are stable.

The data should be clearly marked as synthetic spot actuals derived from static derivative reference prices.

## Data storage

Use repository conventions. Suggested locations:

```text
src/price-api/staticDerivativePrices.ts
src/settlement/staticSpotActualPrices.ts
src/settlement/spotActuals.ts
docs/price-api/static_derivative_price_list.md
docs/settlement/static_spot_actuals.md
tests/price-api/staticDerivativePrices.test.ts
tests/settlement/staticSpotActuals.test.ts
```

Adapt file names if the repo already has better conventions.

## Provider wiring

The existing Price API should be able to use the static derivative price list as a provider.

Add a provider mode or helper if needed, for example:

```text
PRICE_PROVIDER_MODE=fixture|static|real
```

`static` should use the static derivative list and be deterministic.

Do not remove fixture mode.

## Settlement preparation

Add helper functions that the next settlement report package can use:

```text
getMonthlySpotActual(month, priceArea)
getSpotActualsForYear(year, priceArea)
validateSpotActualConsistency
```

The helpers should expose monthly average, peak and offpeak prices.

## Tests

Add tests for:

1. static derivative list contains year, quarter and month blocks,
2. static derivative list has `base.sys` and `base.epad`,
3. Price API can use static derivative provider,
4. static spot actual list covers 2027-01 through 2029-12,
5. every spot actual row has monthly average, peak and offpeak prices,
6. monthly average equals `(peak_price * peak_h + offpeak_price * offpeak_h) / (peak_h + offpeak_h)`,
7. deterministic variation stays within plus/minus 30 percent of reference price,
8. spot actual helpers return values for a selected month,
9. missing month gives clear error,
10. fixture mode still works.

## Documentation

Create or update:

```text
docs/price-api/static_derivative_price_list.md
docs/settlement/static_spot_actuals.md
```

Document:

```text
PoC-only static price list
source or generation method
components covered
block types covered
static provider mode
spot actual fields
spot actual weighted-average formula
why actuals are available immediately in the PoC
known limitations
```

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

Update `REPOSITORY_FILES.md` to match `git ls-files`.

## Completion report

Report:

- files changed,
- derivative price list coverage,
- spot actual list coverage,
- provider mode or helper added,
- tests added,
- tests run,
- test result,
- confirmation that monthly average spot equals weighted peak/offpeak average,
- REPOSITORY_FILES.md status.
