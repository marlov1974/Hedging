# P0026 - Peaks.Classic Legacy Calloff List

## Purpose

Build the first customer-facing Classic Feature Set projection: a Legacy Calloff List for `Peaks.Classic`.

This package should use the canonical component model established by P0025 and project canonical transactions into a Peak/Offpeak calloff list that resembles the old customer-facing legacy view.

This is a coding package, but keep the implementation narrow and controlled.

## Dependency

This package depends on P0025.

Expected canonical components:

```text
allocation.peak
base.sys
base.epad
peak.premium.sys
peak.premium.epad
```

Expected component categories:

```text
allocation
base
peak
profile
volume
currency
adjustment
```

Expected product package terminology:

```text
Portfolio Hedging Products
Baseloads
Peaks.Classic
Peaks.Modern
Profiles.Classic
Profiles.Modern
```

If P0025 has not fully renamed old components yet, support temporary aliases:

```text
PeaksClassic -> Peaks.Classic
PeaksModern -> Peaks.Modern
peak.modern.sys -> peak.premium.sys
peak.modern.epad -> peak.premium.epad
```

Do not reintroduce old terms in new documentation except as compatibility aliases.

## Scope

Implement a `Legacy Calloff List` feature for `Peaks.Classic`.

The feature should show customer-facing calloff rows in Peak/Offpeak terms.

It should not show canonical component rows directly.

It should not show `allocation.peak` as a separate customer row.

It should not show adjustment/internal-only rows.

## Feature placement

`Legacy Calloff List` belongs to:

```text
Product package: Peaks.Classic
Feature set: Classic Feature Set
Projection: Legacy Projection / Peak-Offpeak view
```

If the UI currently selects portfolios/products, the feature should be available only when the selected portfolio product/package is `Peaks.Classic` or a temporary alias of it.

If the PoC does not yet distinguish product package and feature set cleanly, implement the narrowest compatibility behavior possible and document the limitation.

## Legacy volume projection

All canonical component transactions are stored in MW.

For each calloff and month, derive legacy peak/offpeak volumes from:

```text
base_mw
allocation_peak_mw
calendar.total_h
calendar.peak_h
calendar.offpeak_h
```

### Base MW

Base MW should be read from `base.sys` and `base.epad` canonical rows.

Expected normal case:

```text
base.sys.mw == base.epad.mw
```

If both exist and differ beyond a small numeric tolerance, show a data-quality warning and use `base.sys` as the volume carrier for the projection.

If only one exists, use the one that exists and show a warning.

### Allocation peak MW

Read from:

```text
allocation.peak.mw
```

Expected:

```text
allocation.peak.category = allocation
allocation.peak.price = 0
allocation.peak.q_factor = 0
```

If `allocation.peak` is missing, attempt a compatibility fallback only if enough data exists. Otherwise show the calloff/month as incomplete.

### Formula

For each month:

```text
base_mwh = base_mw * total_h
legacy_peak_mw = allocation_peak_mw
legacy_peak_mwh = allocation_peak_mw * peak_h
legacy_offpeak_mwh = base_mwh - legacy_peak_mwh
legacy_offpeak_mw = legacy_offpeak_mwh / offpeak_h
```

Do not derive legacy peak volume from `peak.premium.*` if `allocation.peak` exists.

`peak.premium.*` is a hedge/risk component. `allocation.peak` is the bridge to the customer's peak-hour volume.

## Negative and edge cases

`legacy_offpeak_mwh` can theoretically be negative if allocation peak exceeds total base volume. This should be treated as a data-quality warning, not silently fixed.

`legacy_peak_mwh` should follow `allocation.peak_mw * peak_h` even if unusual.

If `peak_h` or `offpeak_h` is zero, show an error state for that month and do not divide by zero.

## Legacy price projection

Use a value-preserving projected price model.

This package should implement the first version of projected Classic/Legacy prices only for Peaks.Classic.

### Canonical all-in prices

For each month, derive:

```text
base_price = base.sys.price + base.epad.price
peak_premium_price = peak.premium.sys.price + peak.premium.epad.price
```

If one of the price components is missing, use the available part and show a warning.

If the old alias `peak.modern.*` exists, treat it as `peak.premium.*` during compatibility.

### Canonical value

```text
base_value = base_mwh * base_price
peak_premium_mwh = peak_premium_mw * peak_h
peak_premium_value = peak_premium_mwh * peak_premium_price
total_value = base_value + peak_premium_value
```

Use `peak.premium.sys/base` rows as the value-bearing peak premium component.

Do not use `allocation.peak` for value because:

```text
allocation.peak.price = 0
allocation.peak.q_factor = 0
```

### Price allocation rule

Use `base_price` as the offpeak anchor.

This is a deliberate projection rule, not a mathematical identity.

Rationale:

```text
base.* is the flat all-hours base price
peak.premium.* carries the peak premium/shape value above flat base
offpeak should therefore carry base price only
peak receives the residual premium value
```

Formula:

```text
legacy_offpeak_price = base_price
legacy_peak_price = (total_value - legacy_offpeak_mwh * legacy_offpeak_price) / legacy_peak_mwh
```

Equivalent form:

```text
legacy_peak_price = base_price + peak_premium_value / legacy_peak_mwh
```

Use the residual formula in code to preserve value.

If `legacy_peak_mwh` is zero, show an error/warning and do not divide by zero. If needed for UI, set projected peak price to null/blank and show the warning.

### Value check

For every projected month, the following must hold within numeric tolerance:

```text
legacy_offpeak_mwh * legacy_offpeak_price
+ legacy_peak_mwh * legacy_peak_price
= total_value
```

## UI requirements

The Legacy Calloff List should show calloffs grouped in customer-facing rows.

Recommended columns:

```text
Date
Calloff
Period
Block
MW
MWh
Price
Value
Warnings
```

Where:

```text
Block = Peak | Offpeak
```

For a one-month calloff, show two rows:

```text
Offpeak
Peak
```

For a multi-month calloff, either:

1. show one Peak row and one Offpeak row per month, or
2. show aggregated calloff rows by block if the existing UI already aggregates calloffs.

If aggregating across months:

```text
aggregated_mwh = sum(monthly_mwh)
aggregated_value = sum(monthly_value)
aggregated_price = aggregated_value / aggregated_mwh
```

Do not average prices arithmetically across months.

The feature should clearly indicate that prices are projected legacy prices if the UI has room, for example through tooltip/help text or documentation.

## Customer projection filtering

For this feature:

Include canonical categories:

```text
allocation
base
peak
```

But only as inputs to the projection.

Do not display these canonical component rows directly.

Exclude:

```text
adjustment
internal-only components
market-only adjustments
```

If such rows exist, ignore them in customer-facing legacy rows but keep them visible in raw/internal data views.

## Worked example

Use this example in tests and documentation.

Input:

```text
month = 2027-01
forecast_mwh = 100
hedge_pct = 1.0
peak_pct = 0.50
total_h = 744
peak_h = 320
offpeak_h = 424
base.sys.price = 70
base.epad.price = 15
peak.premium.sys.price = 20
peak.premium.epad.price = 2
```

Canonical MW:

```text
base_mw = 100 / 744 = 0.1344086022
allocation_peak_mw = 100 * 0.50 / 320 = 0.15625
peak_premium_mw = 0.15625 - 0.1344086022 = 0.0218413978
```

Legacy volumes:

```text
base_mwh = 100
legacy_peak_mwh = 0.15625 * 320 = 50
legacy_offpeak_mwh = 100 - 50 = 50
legacy_peak_mw = 0.15625
legacy_offpeak_mw = 50 / 424 = 0.1179245283
```

Prices and values:

```text
base_price = 70 + 15 = 85
peak_premium_price = 20 + 2 = 22
peak_premium_mwh = 0.0218413978 * 320 = 6.9892473
base_value = 100 * 85 = 8500
peak_premium_value = 6.9892473 * 22 = 153.76344
total_value = 8653.76344
legacy_offpeak_price = 85
legacy_peak_price = (8653.76344 - 50 * 85) / 50 = 88.0752688
```

Expected customer rows:

```text
Offpeak: MW 0.1179245283, MWh 50, Price 85, Value 4250
Peak:    MW 0.15625,      MWh 50, Price 88.0752688, Value 4403.76344
```

## Negative peak premium example

Input:

```text
month = 2027-01
forecast_mwh = 100
hedge_pct = 1.0
peak_pct = 0.35
total_h = 744
peak_h = 320
offpeak_h = 424
base.sys.price = 70
base.epad.price = 15
peak.premium.sys.price = 20
peak.premium.epad.price = 2
```

Canonical MW:

```text
base_mw = 100 / 744 = 0.1344086022
allocation_peak_mw = 100 * 0.35 / 320 = 0.109375
peak_premium_mw = 0.109375 - 0.1344086022 = -0.0250336022
```

Legacy volumes:

```text
legacy_peak_mwh = 0.109375 * 320 = 35
legacy_offpeak_mwh = 100 - 35 = 65
```

Expected:

```text
legacy_peak_price < base_price
```

The negative peak premium is valid and must not be rejected.

## Data Viewer / internal views

Do not remove or hide canonical rows from internal/raw views.

The raw Data Viewer should still be able to show:

```text
allocation.peak
base.sys
base.epad
peak.premium.sys
peak.premium.epad
```

The Legacy Calloff List is a projected customer-facing feature; the Data Viewer is an internal/raw feature.

## Documentation

Create or update:

```text
docs/hedging/peaks_classic_legacy_calloff_list.md
docs/hedging/classic_projection_price_rules.md
```

Document:

- Classic Feature Set uses Peak/Offpeak customer presentation,
- Legacy Calloff List is a projection from canonical model,
- `allocation.peak` drives legacy peak volume,
- offpeak volume is residual from base total volume,
- `allocation.peak` has no value,
- base price anchors offpeak,
- peak price is residual/value-preserving,
- negative peak premium is valid,
- projected legacy prices are not original market transaction prices.

## Tests

Add or update tests for:

1. Legacy Calloff List is available for `Peaks.Classic`,
2. Legacy Calloff List is not shown for `Peaks.Modern` unless a compatibility alias requires it,
3. one-month calloff creates two projected customer rows: Peak and Offpeak,
4. positive example produces expected peak/offpeak MW and MWh,
5. positive example produces expected peak/offpeak projected prices,
6. projected legacy values sum to canonical total value,
7. negative peak premium is allowed,
8. negative peak premium can produce legacy peak price below base price,
9. allocation rows are not displayed directly as customer rows,
10. adjustment/internal-only rows are excluded from customer legacy rows,
11. Data Viewer/internal views still show all canonical rows,
12. aggregation across months uses value-weighted price, not arithmetic average,
13. zero peak_h/offpeak_h does not cause division by zero,
14. mismatched base.sys/base.epad MW creates a warning.

## Non-goals

Do not implement in this package:

- Modern Projection / Base-Peak feature set,
- complete Profiles projection,
- market adjustment components,
- settlement redesign,
- product migration UI,
- full pricing framework beyond this projected legacy price logic.

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
- where Legacy Calloff List was implemented,
- product package / feature gating behavior,
- volume projection formula implemented,
- price projection formula implemented,
- positive example test result,
- negative example test result,
- aggregation behavior,
- warnings implemented,
- tests run and result,
- `REPOSITORY_FILES.md` status.
