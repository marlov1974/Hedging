# P0029 - Peaks Calloff Transaction Lists: Classic and Modern Projections

## Purpose

Build both customer-facing Peaks calloff transaction list projections from the same canonical component model:

```text
Peaks.Classic -> Classic Feature Set -> Peak/Offpeak transaction list
Peaks.Modern  -> Modern Feature Set  -> Base/Peak transaction list
```

This replaces the earlier narrower P0029 scope that only described the Modern list and incorrectly treated canonical MW values as projected customer MW values.

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
Product packages: Peaks.Classic, Peaks.Modern
Feature sets: Classic Feature Set, Modern Feature Set
```

## Core principle

The database stores the canonical model.

Customer transaction lists are projections.

Do not show canonical component rows directly in either transaction list.

The same canonical calloff must be projectable into:

```text
Classic: Offpeak / Peak
Modern:  Base / Peak
```

## Canonical inputs per month

For each calloff/month and dimension, read:

```text
base.sys.mw
base.epad.mw
peak.sys.mw
peak.epad.mw
allocation.peak.sys.mw
allocation.peak.epad.mw
```

Use effective values for customer projection.

Normal cases:

```text
base.sys.mw == base.epad.mw
peak.sys.mw == peak.epad.mw
allocation.peak.sys.mw == allocation.peak.epad.mw
```

Effective customer values:

```text
B = effective canonical base MW
P = effective canonical peak component MW
A = effective allocation peak MW
```

Use `sys` as the effective volume carrier if `sys` and `epad` differ, and show a data-quality warning. Do not silently average.

Expected canonical relation:

```text
A = B + P
P = A - B
```

If this relation does not hold within tolerance, show a data-quality warning and use `B` and `A` as primary projection inputs. Derive projected customer MW from `B` and `A`.

Calendar values:

```text
H  = total_h
Hp = peak_h
Ho = offpeak_h
```

Do not divide by zero. If `Hp` or `Ho` is zero, show an error/warning for that calloff/month.

## Canonical prices and values

Canonical all-in prices:

```text
CanonicalBasePrice = base.sys.price + base.epad.price
CanonicalPeakPrice = peak.sys.price + peak.epad.price
```

If a dimension is missing, use the available dimension and show a warning.

Canonical values:

```text
CanonicalBaseMWh = B * H
CanonicalPeakMWh = P * Hp
CanonicalBaseValue = CanonicalBaseMWh * CanonicalBasePrice
CanonicalPeakValue = CanonicalPeakMWh * CanonicalPeakPrice
CanonicalTotalValue = CanonicalBaseValue + CanonicalPeakValue
```

`P` and therefore `CanonicalPeakMWh` may be positive, zero or negative.

## Projection MW calculations

From canonical model, compute the four projected MW values:

```text
ClassicOffpeakMW
ClassicPeakMW
ModernBaseMW
ModernPeakMW
```

### Step 1: physical customer volumes

```text
TotalMWh = B * H
PeakMWh = A * Hp
OffpeakMWh = TotalMWh - PeakMWh
```

### Step 2: Classic projection MW

Classic means Peak/Offpeak levels.

```text
ClassicOffpeakMW = OffpeakMWh / Ho
ClassicPeakMW = A
```

Equivalent formula:

```text
ClassicOffpeakMW = (B * H - A * Hp) / Ho
```

If the canonical relation `A = B + P` holds, this can also be written:

```text
ClassicOffpeakMW = B - P * Hp / Ho
ClassicPeakMW = B + P
```

### Step 3: Modern projection MW

Modern means Base/Peak where:

```text
Base = offpeak level applied as base layer
Peak = extra effect above Base in peak hours
```

Therefore:

```text
ModernBaseMW = ClassicOffpeakMW
ModernPeakMW = ClassicPeakMW - ModernBaseMW
```

Equivalent formula, when canonical relation holds:

```text
ModernBaseMW = B - P * Hp / Ho
ModernPeakMW = P * H / Ho
```

`ModernPeakMW` may be positive, zero or negative.

## Projection price calculations

Compute four projected prices:

```text
ClassicOffpeakPrice
ClassicPeakPrice
ModernBasePrice
ModernPeakPrice
```

All projection prices must preserve canonical total value.

### Classic projection prices

Classic Offpeak is anchored to canonical base price.

```text
ClassicOffpeakPrice = CanonicalBasePrice
```

Classic Peak is residual/value-preserving.

```text
ClassicOffpeakMWh = ClassicOffpeakMW * Ho
ClassicPeakMWh = ClassicPeakMW * Hp

ClassicPeakPrice =
  (CanonicalTotalValue - ClassicOffpeakMWh * ClassicOffpeakPrice)
  / ClassicPeakMWh
```

If `ClassicPeakMWh = 0`, set `ClassicPeakPrice` to blank/null and show a warning. Do not divide by zero.

Value check:

```text
ClassicOffpeakMWh * ClassicOffpeakPrice
+ ClassicPeakMWh * ClassicPeakPrice
= CanonicalTotalValue
```

### Modern projection prices

Modern Base is anchored to canonical base price.

```text
ModernBasePrice = CanonicalBasePrice
```

Modern Peak is residual/value-preserving.

Modern Base is a base layer across the whole month. Modern Peak is an additional layer during peak hours.

```text
ModernBaseMWh = ModernBaseMW * H
ModernPeakMWh = ModernPeakMW * Hp

ModernPeakPrice =
  (CanonicalTotalValue - ModernBaseMWh * ModernBasePrice)
  / ModernPeakMWh
```

If `ModernPeakMWh = 0`, set `ModernPeakPrice` to blank/null and show a warning. Do not divide by zero.

If `ModernPeakMWh` is negative, the same formula applies. Negative modern peak is valid.

Value check:

```text
ModernBaseMWh * ModernBasePrice
+ ModernPeakMWh * ModernPeakPrice
= CanonicalTotalValue
```

## Customer-facing features

Implement or align two transaction list features.

### 1. Peaks.Classic Calloff Transaction List

Feature placement:

```text
Product package: Peaks.Classic
Feature set: Classic Feature Set
Projection: Peak/Offpeak transaction list
```

Required columns:

```text
Date
OffpeakMW
PeakMW
OffpeakPrice
PeakPrice
```

Column definitions:

```text
Date = calloff date
OffpeakMW = ClassicOffpeakMW
PeakMW = ClassicPeakMW
OffpeakPrice = ClassicOffpeakPrice
PeakPrice = ClassicPeakPrice
```

This may reuse or replace the existing P0026 Legacy Calloff List logic. If both features exist, ensure they use the same calculation engine and do not diverge.

### 2. Peaks.Modern Calloff Transaction List

Feature placement:

```text
Product package: Peaks.Modern
Feature set: Modern Feature Set
Projection: Base/Peak transaction list
```

Required columns:

```text
Date
BaseMW
PeakMW
BasePrice
PeakPrice
```

Column definitions:

```text
Date = calloff date
BaseMW = ModernBaseMW
PeakMW = ModernPeakMW
BasePrice = ModernBasePrice
PeakPrice = ModernPeakPrice
```

Important: Modern `BaseMW` is not canonical `base.sys.mw`. It is the projected base/offpeak level.

Important: Modern `PeakMW` is not canonical `peak.sys.mw`. It is the projected extra effect above the Modern Base level.

## Resolution and aggregation

Both transaction lists are in calloff resolution.

If a calloff has one month only, show one row.

If a calloff spans multiple months, show one calloff-level row, not one row per canonical transaction.

For multi-month calloffs, aggregate by value and hours, not by arithmetic averages.

### Aggregate Classic values

For each month, compute monthly projected MW, MWh, price and value first.

Then aggregate:

```text
ClassicOffpeakMW = sum(ClassicOffpeakMWh) / sum(Ho)
ClassicPeakMW = sum(ClassicPeakMWh) / sum(Hp)
ClassicOffpeakPrice = sum(ClassicOffpeakValue) / sum(ClassicOffpeakMWh)
ClassicPeakPrice = sum(ClassicPeakValue) / sum(ClassicPeakMWh)
```

If denominator is zero, show blank/null and warning.

### Aggregate Modern values

For each month, compute monthly projected MW, MWh, price and value first.

Then aggregate:

```text
ModernBaseMW = sum(ModernBaseMWh) / sum(H)
ModernPeakMW = sum(ModernPeakMWh) / sum(Hp)
ModernBasePrice = sum(ModernBaseValue) / sum(ModernBaseMWh)
ModernPeakPrice = sum(ModernPeakValue) / sum(ModernPeakMWh)
```

If denominator is zero, show blank/null and warning.

Negative ModernPeakMWh is valid and should use the same value-weighted formula.

## Display rules

Classic list column order:

```text
Date | OffpeakMW | PeakMW | OffpeakPrice | PeakPrice
```

Modern list column order:

```text
Date | BaseMW | PeakMW | BasePrice | PeakPrice
```

Optional columns are allowed if already standard in the UI:

```text
CalloffId
Period
Warnings
```

Do not show canonical component codes as customer-facing rows.

Do not show allocation rows directly:

```text
allocation.peak.sys
allocation.peak.epad
```

Do not show internal adjustment rows.

## Compatibility aliases

Support old component names only as read aliases if old fixture/seed rows remain:

```text
peak.premium.sys -> peak.sys
peak.premium.epad -> peak.epad
peak.modern.sys -> peak.sys
peak.modern.epad -> peak.epad
allocation.peak -> allocation.peak.sys/allocation.peak.epad
```

New output, seed data and docs should use only target names.

## Worked one-month example

Input canonical rows for one calloff/month:

```text
Date = 2027-01-10
H = 744
Hp = 320
Ho = 424
base.sys.mw = 0.1344086022
base.epad.mw = 0.1344086022
allocation.peak.sys.mw = 0.15625
allocation.peak.epad.mw = 0.15625
peak.sys.mw = 0.0218413978
peak.epad.mw = 0.0218413978
base.sys.price = 70
base.epad.price = 15
peak.sys.price = 20
peak.epad.price = 2
```

Canonical prices and values:

```text
CanonicalBasePrice = 85
CanonicalPeakPrice = 22
CanonicalBaseMWh = 0.1344086022 * 744 = 100
CanonicalPeakMWh = 0.0218413978 * 320 = 6.9892473
CanonicalTotalValue = 100 * 85 + 6.9892473 * 22 = 8653.76344
```

Projected MW:

```text
ClassicOffpeakMW = (0.1344086022 * 744 - 0.15625 * 320) / 424
                 = 0.1179245283
ClassicPeakMW = 0.15625

ModernBaseMW = 0.1179245283
ModernPeakMW = 0.15625 - 0.1179245283
             = 0.0383254717
```

Classic prices:

```text
ClassicOffpeakMWh = 0.1179245283 * 424 = 50
ClassicPeakMWh = 0.15625 * 320 = 50
ClassicOffpeakPrice = 85
ClassicPeakPrice = (8653.76344 - 50 * 85) / 50
                 = 88.0752688
```

Modern prices:

```text
ModernBaseMWh = 0.1179245283 * 744 = 87.7358491
ModernPeakMWh = 0.0383254717 * 320 = 12.2641510
ModernBasePrice = 85
ModernPeakPrice = (8653.76344 - 87.7358491 * 85) / 12.2641510
                = 97.9250000 approximately
```

Expected Classic row:

```text
Date          = 2027-01-10
OffpeakMW     = 0.1179245283
PeakMW        = 0.15625
OffpeakPrice  = 85
PeakPrice     = 88.0752688
```

Expected Modern row:

```text
Date      = 2027-01-10
BaseMW    = 0.1179245283
PeakMW    = 0.0383254717
BasePrice = 85
PeakPrice = 97.9250000 approximately
```

## Negative peak example

Input:

```text
H = 744
Hp = 320
Ho = 424
B = 0.1344086022
A = 0.109375
P = -0.0250336022
CanonicalBasePrice = 85
CanonicalPeakPrice = 22
```

Projected MW:

```text
ClassicOffpeakMW = (B * H - A * Hp) / Ho
ClassicPeakMW = A
ModernBaseMW = ClassicOffpeakMW
ModernPeakMW = A - ModernBaseMW
```

Expected:

```text
ModernPeakMW may be negative.
ClassicPeakMW remains the actual peak level.
Projection prices must still preserve CanonicalTotalValue.
```

## Documentation

Create or update:

```text
docs/hedging/peaks_classic_calloff_transaction_list.md
docs/hedging/peaks_modern_calloff_transaction_list.md
docs/hedging/projection_mw_and_price_rules.md
docs/hedging/modern_projection_base_peak_rules.md
docs/hedging/classic_projection_peak_offpeak_rules.md
```

Document:

- canonical model is not the customer projection,
- Classic projection shows Offpeak/Peak levels,
- Modern projection shows Base/Peak where Base is offpeak level and Peak is extra above Base,
- four projected MW calculations,
- four projected price calculations,
- value preservation rules,
- allocation rows are not displayed directly,
- negative Modern Peak is valid,
- multi-month calloffs use hour/value weighting.

## Tests

Add or update tests for:

1. Classic list is available for `Peaks.Classic`,
2. Modern list is available for `Peaks.Modern`,
3. Classic list required columns exist and are ordered: Date, OffpeakMW, PeakMW, OffpeakPrice, PeakPrice,
4. Modern list required columns exist and are ordered: Date, BaseMW, PeakMW, BasePrice, PeakPrice,
5. ClassicOffpeakMW formula is correct,
6. ClassicPeakMW formula is correct,
7. ModernBaseMW formula is correct,
8. ModernPeakMW formula is correct,
9. ClassicOffpeakPrice = CanonicalBasePrice,
10. ClassicPeakPrice is residual/value-preserving,
11. ModernBasePrice = CanonicalBasePrice,
12. ModernPeakPrice is residual/value-preserving,
13. Classic projected values sum to canonical total value,
14. Modern projected values sum to canonical total value,
15. Modern BaseMW is not incorrectly set to canonical base.sys.mw,
16. Modern PeakMW is not incorrectly set to canonical peak.sys.mw,
17. negative ModernPeakMW is allowed,
18. allocation rows are not displayed directly,
19. internal adjustment rows are not displayed,
20. multi-month aggregation uses hour/value weighting,
21. zero denominators do not divide by zero,
22. warnings appear for mismatched sys/epad MW values,
23. compatibility aliases can be read if old fixtures remain.

## Non-goals

Do not implement in this package:

- market projection changes,
- settlement,
- product migration UI,
- Profiles projections,
- new pricing providers.

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
- where Classic and Modern calloff transaction lists were implemented,
- feature gating behavior,
- one-month example result for Classic,
- one-month example result for Modern,
- negative peak example behavior,
- multi-month aggregation behavior,
- warnings implemented,
- docs created/updated,
- tests run and result,
- `REPOSITORY_FILES.md` status.
