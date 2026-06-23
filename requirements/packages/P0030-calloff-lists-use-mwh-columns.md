# P0030 - Calloff transaction lists must display MWh, not MW

## Purpose

Fix the Peaks customer-facing calloff transaction lists so they display energy volumes in MWh, not effect values in MW.

P0029 introduced Classic and Modern calloff transaction lists, but the requested customer-facing columns should be MWh-based.

This is a corrective coding package.

## Dependency

This package depends on P0025-P0029.

Expected canonical Peaks components after P0028:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

P0029 must still be used for the projection logic, but its customer-facing columns must be corrected from MW to MWh.

## Core correction

Customer-facing calloff transaction lists should show MWh.

MW values are still used internally to calculate MWh, but the displayed list columns must be MWh.

## Updated customer-facing columns

### Peaks.Classic Calloff Transaction List

Replace:

```text
Date
OffpeakMW
PeakMW
OffpeakPrice
PeakPrice
```

with:

```text
Date
OffpeakMWh
PeakMWh
OffpeakPrice
PeakPrice
```

### Peaks.Modern Calloff Transaction List

Replace:

```text
Date
BaseMW
PeakMW
BasePrice
PeakPrice
```

with:

```text
Date
BaseMWh
PeakMWh
BasePrice
PeakPrice
```

## Internal projection calculations

Keep the internal MW calculations from P0029, because they are still needed to derive MWh.

Per month:

```text
B = effective canonical base MW
A = effective allocation peak MW
P = effective canonical peak MW
H = total_h
Hp = peak_h
Ho = offpeak_h
```

Physical volumes:

```text
TotalMWh = B * H
ClassicPeakMWh = A * Hp
ClassicOffpeakMWh = TotalMWh - ClassicPeakMWh
```

Classic projected MW may still be computed internally:

```text
ClassicOffpeakMW = ClassicOffpeakMWh / Ho
ClassicPeakMW = A
```

Modern projected MW may still be computed internally:

```text
ModernBaseMW = ClassicOffpeakMW
ModernPeakMW = ClassicPeakMW - ModernBaseMW
```

But the Modern list must display MWh:

```text
ModernBaseMWh = ModernBaseMW * H
ModernPeakMWh = ModernPeakMW * Hp
```

Equivalently:

```text
ModernBaseMWh = ClassicOffpeakMW * H
ModernPeakMWh = (A - ClassicOffpeakMW) * Hp
```

## Price calculations remain value-preserving

Do not change the price logic except to use the corrected displayed MWh columns.

Canonical prices and values:

```text
CanonicalBasePrice = base.sys.price + base.epad.price
CanonicalPeakPrice = peak.sys.price + peak.epad.price
CanonicalBaseMWh = B * H
CanonicalPeakMWh = P * Hp
CanonicalBaseValue = CanonicalBaseMWh * CanonicalBasePrice
CanonicalPeakValue = CanonicalPeakMWh * CanonicalPeakPrice
CanonicalTotalValue = CanonicalBaseValue + CanonicalPeakValue
```

### Classic prices

```text
ClassicOffpeakPrice = CanonicalBasePrice
ClassicPeakPrice =
  (CanonicalTotalValue - ClassicOffpeakMWh * ClassicOffpeakPrice)
  / ClassicPeakMWh
```

If `ClassicPeakMWh = 0`, set `ClassicPeakPrice` to blank/null and show a warning.

Classic value check:

```text
ClassicOffpeakMWh * ClassicOffpeakPrice
+ ClassicPeakMWh * ClassicPeakPrice
= CanonicalTotalValue
```

### Modern prices

```text
ModernBasePrice = CanonicalBasePrice
ModernPeakPrice =
  (CanonicalTotalValue - ModernBaseMWh * ModernBasePrice)
  / ModernPeakMWh
```

If `ModernPeakMWh = 0`, set `ModernPeakPrice` to blank/null and show a warning.

Modern value check:

```text
ModernBaseMWh * ModernBasePrice
+ ModernPeakMWh * ModernPeakPrice
= CanonicalTotalValue
```

`ModernPeakMWh` may be positive, zero or negative.

## Display rules

Classic list column order:

```text
Date | OffpeakMWh | PeakMWh | OffpeakPrice | PeakPrice
```

Modern list column order:

```text
Date | BaseMWh | PeakMWh | BasePrice | PeakPrice
```

Optional additional columns are allowed if already standard in the UI:

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

## Aggregation across months

Calloff lists are in calloff resolution.

If a calloff spans multiple months, aggregate MWh and values.

### Classic aggregation

```text
OffpeakMWh = sum(monthly ClassicOffpeakMWh)
PeakMWh = sum(monthly ClassicPeakMWh)
OffpeakValue = sum(monthly ClassicOffpeakMWh * monthly ClassicOffpeakPrice)
PeakValue = sum(monthly ClassicPeakMWh * monthly ClassicPeakPrice)
OffpeakPrice = OffpeakValue / OffpeakMWh
PeakPrice = PeakValue / PeakMWh
```

If a denominator is zero, show blank/null and warning.

### Modern aggregation

```text
BaseMWh = sum(monthly ModernBaseMWh)
PeakMWh = sum(monthly ModernPeakMWh)
BaseValue = sum(monthly ModernBaseMWh * monthly ModernBasePrice)
PeakValue = sum(monthly ModernPeakMWh * monthly ModernPeakPrice)
BasePrice = BaseValue / BaseMWh
PeakPrice = PeakValue / PeakMWh
```

If a denominator is zero, show blank/null and warning.

If `PeakMWh` is negative, the same value-weighted price formula applies.

Do not average prices arithmetically across months.

## Worked one-month example

Input canonical rows for one calloff/month:

```text
Date = 2027-01-10
H = 744
Hp = 320
Ho = 424
B = 0.1344086022
A = 0.15625
P = 0.0218413978
CanonicalBasePrice = 85
CanonicalPeakPrice = 22
```

Canonical values:

```text
CanonicalBaseMWh = B * H = 100
CanonicalPeakMWh = P * Hp = 6.9892473
CanonicalTotalValue = 100 * 85 + 6.9892473 * 22 = 8653.76344
```

Classic projection:

```text
ClassicPeakMWh = A * Hp = 50
ClassicOffpeakMWh = B * H - ClassicPeakMWh = 50
ClassicOffpeakPrice = 85
ClassicPeakPrice = (8653.76344 - 50 * 85) / 50 = 88.0752688
```

Expected Classic row:

```text
Date          = 2027-01-10
OffpeakMWh    = 50
PeakMWh       = 50
OffpeakPrice  = 85
PeakPrice     = 88.0752688
```

Modern projection:

```text
ClassicOffpeakMW = 50 / 424 = 0.1179245283
ModernBaseMW = 0.1179245283
ModernPeakMW = 0.15625 - 0.1179245283 = 0.0383254717
ModernBaseMWh = 0.1179245283 * 744 = 87.7358491
ModernPeakMWh = 0.0383254717 * 320 = 12.2641510
ModernBasePrice = 85
ModernPeakPrice = (8653.76344 - 87.7358491 * 85) / 12.2641510 = approximately 97.925
```

Expected Modern row:

```text
Date      = 2027-01-10
BaseMWh   = 87.7358491
PeakMWh   = 12.2641510
BasePrice = 85
PeakPrice = approximately 97.925
```

## Negative peak case

If Modern projected `PeakMWh` is negative, display it as negative.

Do not reject it.

Use the same residual value-preserving price formula.

## Documentation updates

Update docs created/updated by P0029:

```text
docs/hedging/peaks_classic_calloff_transaction_list.md
docs/hedging/peaks_modern_calloff_transaction_list.md
docs/hedging/projection_mw_and_price_rules.md
docs/hedging/modern_projection_base_peak_rules.md
docs/hedging/classic_projection_peak_offpeak_rules.md
```

Rename or clarify documentation from MW-list to MWh-list.

Document that MW is internal calculation support, while customer-facing calloff transaction list rows display MWh.

## Tests

Add or update tests for:

1. Classic list columns are Date, OffpeakMWh, PeakMWh, OffpeakPrice, PeakPrice,
2. Modern list columns are Date, BaseMWh, PeakMWh, BasePrice, PeakPrice,
3. Classic list no longer displays OffpeakMW/PeakMW as required columns,
4. Modern list no longer displays BaseMW/PeakMW as required columns,
5. Classic one-month example displays 50/50 MWh,
6. Modern one-month example displays BaseMWh 87.7358491 and PeakMWh 12.2641510,
7. Classic projected values sum to canonical total value,
8. Modern projected values sum to canonical total value,
9. multi-month aggregation sums MWh, not MW,
10. multi-month prices are value-weighted,
11. negative Modern PeakMWh is allowed and displayed,
12. zero denominators do not divide by zero,
13. allocation rows are not displayed directly,
14. adjustment/internal rows are not displayed,
15. raw/internal Data Viewer can still display MW canonical transaction rows.

## Non-goals

Do not redesign:

- canonical component model,
- forecast hedge generation,
- market projection,
- settlement,
- product migration UI,
- Profiles projections.

This package only fixes customer-facing calloff transaction list units and column names.

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
- Classic list columns after fix,
- Modern list columns after fix,
- one-month Classic example result,
- one-month Modern example result,
- multi-month aggregation behavior,
- negative PeakMWh behavior,
- docs updated,
- tests run and result,
- `REPOSITORY_FILES.md` status.
