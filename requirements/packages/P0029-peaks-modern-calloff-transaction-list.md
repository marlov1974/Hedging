# P0029 - Peaks.Modern Calloff Transaction List

## Purpose

Build the first customer-facing Modern Feature Set projection: a `Peaks.Modern` calloff transaction list in Base/Peak terms.

This feature should project canonical component transactions into one calloff-level row per calloff, with the following columns:

```text
Date
BaseMW
PeakMW
BasePrice
PeakPrice
```

This is a coding package.

## Dependency

This package depends on P0025-P0028.

Expected target canonical Peaks components after P0028:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

Expected product package terminology:

```text
Product family: Portfolio Hedging Products
Product package: Peaks.Modern
Feature set: Modern Feature Set
Projection: Modern Projection / Base-Peak view
```

## Scope

Implement a `Calloff Transaction List` feature for `Peaks.Modern`.

The list is a customer-facing Modern Projection.

It should show the position in Base/Peak terms, not Peak/Offpeak terms.

It should be shown in calloff resolution.

Do not build full settlement or full market position in this package.

## Feature placement

The feature belongs to:

```text
Product package: Peaks.Modern
Feature set: Modern Feature Set
Projection: Modern Projection / Base-Peak view
```

The feature should be available for selected portfolios/products/packages identified as `Peaks.Modern`.

If old compatibility names still exist, support aliases:

```text
PeaksModern -> Peaks.Modern
```

Do not show this feature for `Peaks.Classic` unless a temporary compatibility condition makes it unavoidable. If compatibility leakage is needed, document it in the package run report.

## Input rows

For each calloff and month, read canonical rows:

```text
base.sys
base.epad
peak.sys
peak.epad
```

Allocation rows are not displayed directly in this feature:

```text
allocation.peak.sys
allocation.peak.epad
```

They may be used for validation, but the Modern transaction list columns are based on base and peak rows.

## Required output columns

The table must include:

```text
Date
BaseMW
PeakMW
BasePrice
PeakPrice
```

### Date

`Date` is the calloff date, i.e. when the calloff was made.

Use the canonical calloff date field.

### BaseMW

`BaseMW` is the effective base MW for the calloff.

Normal case:

```text
base.sys.mw == base.epad.mw
```

Use:

```text
BaseMW = base.sys.mw
```

If `base.sys.mw` and `base.epad.mw` differ beyond tolerance:

- show a warning,
- use `base.sys.mw` as effective BaseMW,
- do not silently average.

If only one base dimension exists, use the one that exists and show a warning.

### PeakMW

`PeakMW` is the effective canonical peak MW for the calloff.

Normal case:

```text
peak.sys.mw == peak.epad.mw
```

Use:

```text
PeakMW = peak.sys.mw
```

If `peak.sys.mw` and `peak.epad.mw` differ beyond tolerance:

- show a warning,
- use `peak.sys.mw` as effective PeakMW,
- do not silently average.

`PeakMW` may be positive, zero or negative.

This is valid and must not be rejected.

### BasePrice

`BasePrice` is the all-in base price:

```text
BasePrice = base.sys.price + base.epad.price
```

If one dimension is missing, use the available dimension and show a warning.

Do not average sys and epad. This is a sum of price components.

### PeakPrice

`PeakPrice` is the all-in peak price:

```text
PeakPrice = peak.sys.price + peak.epad.price
```

If one dimension is missing, use the available dimension and show a warning.

Do not average sys and epad. This is a sum of price components.

## Resolution and aggregation

The feature is in calloff resolution.

If a calloff has one month only, show one row.

If a calloff spans multiple months, the feature should still show one calloff-level row, not one row per canonical transaction.

For multi-month calloffs, aggregate as follows.

### BaseMW aggregation

Use MWh-weighted average MW by total hours, equivalent to total base MWh divided by total hours:

```text
BaseMW = sum(base_mw_month * total_h_month) / sum(total_h_month)
```

### PeakMW aggregation

Use MWh-weighted average MW by peak hours, equivalent to total peak component MWh divided by total peak hours:

```text
PeakMW = sum(peak_mw_month * peak_h_month) / sum(peak_h_month)
```

### BasePrice aggregation

Use value-weighted base price:

```text
base_mwh_month = base_mw_month * total_h_month
base_price_month = base.sys.price + base.epad.price
base_value_month = base_mwh_month * base_price_month

BasePrice = sum(base_value_month) / sum(base_mwh_month)
```

Do not use arithmetic average across months.

### PeakPrice aggregation

Use value-weighted peak price:

```text
peak_mwh_month = peak_mw_month * peak_h_month
peak_price_month = peak.sys.price + peak.epad.price
peak_value_month = peak_mwh_month * peak_price_month

PeakPrice = sum(peak_value_month) / sum(peak_mwh_month)
```

If `sum(peak_mwh_month) = 0`, set `PeakPrice` to blank/null and show a warning. Do not divide by zero.

If `sum(peak_mwh_month)` is negative, the value-weighted formula still applies. Negative peak MW/MWh is valid.

## Display rules

Show the required columns in this order:

```text
Date | BaseMW | PeakMW | BasePrice | PeakPrice
```

Optional additional columns are allowed only if already standard in the UI, for example:

```text
CalloffId
Period
Warnings
```

Do not show canonical component codes as customer-facing rows in this feature.

Do not show `allocation.peak.sys` or `allocation.peak.epad` as rows.

Do not show internal adjustment rows.

## Compatibility aliases

Support old component names only as read aliases if old fixture/seed rows remain:

```text
peak.premium.sys -> peak.sys
peak.premium.epad -> peak.epad
peak.modern.sys -> peak.sys
peak.modern.epad -> peak.epad
```

For allocation compatibility:

```text
allocation.peak -> allocation.peak.sys/allocation.peak.epad
```

New output, seed data and docs should use only target names.

## Worked one-month example

Input canonical rows for one calloff/month:

```text
Date = 2027-01-10
base.sys.mw = 0.1344086022
base.epad.mw = 0.1344086022
peak.sys.mw = 0.0218413978
peak.epad.mw = 0.0218413978
base.sys.price = 70
base.epad.price = 15
peak.sys.price = 20
peak.epad.price = 2
```

Expected row:

```text
Date      = 2027-01-10
BaseMW    = 0.1344086022
PeakMW    = 0.0218413978
BasePrice = 85
PeakPrice = 22
```

## Negative peak example

Input:

```text
Date = 2027-01-10
base.sys.mw = 0.1344086022
base.epad.mw = 0.1344086022
peak.sys.mw = -0.0250336022
peak.epad.mw = -0.0250336022
base.sys.price = 70
base.epad.price = 15
peak.sys.price = 20
peak.epad.price = 2
```

Expected row:

```text
Date      = 2027-01-10
BaseMW    = 0.1344086022
PeakMW    = -0.0250336022
BasePrice = 85
PeakPrice = 22
```

Negative PeakMW is valid.

## Documentation

Create or update:

```text
docs/hedging/peaks_modern_calloff_transaction_list.md
docs/hedging/modern_projection_base_peak_rules.md
```

Document:

- Peaks.Modern is a product package under Portfolio Hedging Products,
- Modern Feature Set presents calloffs in Base/Peak terms,
- BaseMW comes from base.sys/base.epad,
- PeakMW comes from peak.sys/peak.epad,
- allocation rows are not displayed directly,
- BasePrice is base.sys + base.epad,
- PeakPrice is peak.sys + peak.epad,
- negative PeakMW is valid,
- multi-month calloffs use hour-/value-weighted aggregation.

## Tests

Add or update tests for:

1. feature is available for `Peaks.Modern`,
2. feature is not available for `Peaks.Classic`,
3. one-month calloff shows one row,
4. required columns exist and are ordered: Date, BaseMW, PeakMW, BasePrice, PeakPrice,
5. BaseMW uses base.sys/base.epad MW and warns on mismatch,
6. PeakMW uses peak.sys/peak.epad MW and warns on mismatch,
7. BasePrice = base.sys.price + base.epad.price,
8. PeakPrice = peak.sys.price + peak.epad.price,
9. negative PeakMW is allowed and displayed,
10. allocation rows are not displayed directly,
11. adjustment/internal rows are not displayed,
12. multi-month BaseMW uses hour-weighted aggregation,
13. multi-month PeakMW uses peak-hour-weighted aggregation,
14. multi-month BasePrice uses value-weighted aggregation,
15. multi-month PeakPrice uses value-weighted aggregation,
16. zero total peak MWh does not divide by zero,
17. old peak alias rows can be read if old fixtures remain,
18. new generated rows/docs use `peak.sys` and `peak.epad`.

## Non-goals

Do not implement in this package:

- Legacy Calloff List changes beyond avoiding regressions,
- Classic Feature Set redesign,
- market projection changes,
- settlement,
- product migration UI,
- Profiles projections.

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
- where the Modern Calloff Transaction List was implemented,
- feature gating behavior,
- one-month example result,
- negative peak example result,
- multi-month aggregation behavior,
- warnings implemented,
- docs created/updated,
- tests run and result,
- `REPOSITORY_FILES.md` status.
