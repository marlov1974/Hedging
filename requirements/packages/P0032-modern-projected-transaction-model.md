# P0032 - Modern Projected Transaction Model

## Purpose

Correct and formalize the Modern projected data model views that were started in P0031.

The purpose is not to create another raw Data Viewer.

The purpose is to demonstrate that the canonical component model is 100% compatible with a data model optimized only for `Peaks.Modern`, without considering product switches, Classic/Legacy compatibility, or historical data compatibility.

This package defines a projected modern-only data model derived from the canonical model.

## Conceptual goal

The PoC must show this equivalence:

```text
Canonical component model
→ Modern projected model
→ same economic value and same customer-facing modern semantics
```

The modern projected model should look like the database model we would have designed if we only needed `Peaks.Modern` and did not care about:

- switching between products,
- supporting `Peaks.Classic`,
- legacy Peak/Offpeak views,
- historical compatibility,
- canonical component reuse.

## Important terminology

### Canonical model

Canonical rows are the internal database truth.

Canonical components include:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

Canonical meanings:

```text
base.* = flat monthly average MW over total_h
allocation.peak.* = customer's actual peak-hour MW helper/allocation value
peak.* = canonical peak component relative to flat monthly base
```

### Modern projected model

Modern projected rows are derived/projection rows.

They must not be confused with canonical rows.

Use explicit modern component names:

```text
modern.base.sys
modern.base.epad
modern.peak.sys
modern.peak.epad
```

Modern projected meanings:

```text
modern.base.* = modern base layer, i.e. offpeak level applied as base layer over the whole month
modern.peak.* = modern peak layer, i.e. extra peak effect above modern base during peak hours
```

## Required projected views

Implement or correct two views/features in Data Viewer or equivalent debug/demo area:

```text
Modern Projected Calloffs
Modern Projected Transactions
```

Names should be explicit. Do not call them just `Modern Calloffs` or `Modern Transactions` if that risks confusion with raw tables.

These are projected logical views, not persisted raw transaction tables unless the existing PoC architecture requires materialized view-like objects. If materialized, clearly document that they are derived from canonical rows.

## Modern Projected Transactions

### Table columns

The Modern Projected Transactions view must have exactly these core columns:

```text
calloff_id
month
component
mw
price
```

Optional debug columns are allowed only if useful and clearly marked, for example:

```text
value
source_components
warnings
```

### Components

Rows must use these projected component names:

```text
modern.base.sys
modern.base.epad
modern.peak.sys
modern.peak.epad
```

Do not use canonical component names in the `component` column of this projected view.

Wrong in this view:

```text
base.sys
base.epad
peak.sys
peak.epad
allocation.peak.sys
allocation.peak.epad
```

Correct in this view:

```text
modern.base.sys
modern.base.epad
modern.peak.sys
modern.peak.epad
```

## Modern Projected Calloffs

### Table columns

The Modern Projected Calloffs view should summarize the projected modern transactions per calloff.

Required core columns:

```text
calloff_id
date
period_start
period_end
base_mwh
peak_mwh
base_price
peak_price
base_value
peak_value
total_value
```

If the current UI cannot show all columns cleanly, it must at minimum show:

```text
calloff_id
date
base_mwh
peak_mwh
base_price
peak_price
total_value
```

## Canonical input extraction per month

For each calloff/month, read canonical rows:

```text
base.sys
base.epad
peak.sys
peak.epad
allocation.peak.sys
allocation.peak.epad
```

Effective MW values:

```text
B_sys = base.sys.mw
B_epad = base.epad.mw
P_sys = peak.sys.mw
P_epad = peak.epad.mw
A_sys = allocation.peak.sys.mw
A_epad = allocation.peak.epad.mw
```

Normal expectation:

```text
B_sys == B_epad
P_sys == P_epad
A_sys == A_epad
```

If mismatched beyond tolerance:

- keep both dimensions separate for sys/epad calculations where possible,
- show warning,
- never silently average sys and epad,
- do not sum sys and epad as physical volume.

Calendar inputs:

```text
H  = total_h
Hp = peak_h
Ho = offpeak_h
```

## Modern projected MW calculations

The modern projected MW must be calculated per dimension.

### Step 1: derive modern base level

For each dimension, calculate physical offpeak level from canonical total volume and allocation peak volume.

System dimension:

```text
TotalMWh_sys = B_sys * H
PeakLevelMWh_sys = A_sys * Hp
OffpeakMWh_sys = TotalMWh_sys - PeakLevelMWh_sys
modern_base_sys_mw = OffpeakMWh_sys / Ho
```

EPAD dimension:

```text
TotalMWh_epad = B_epad * H
PeakLevelMWh_epad = A_epad * Hp
OffpeakMWh_epad = TotalMWh_epad - PeakLevelMWh_epad
modern_base_epad_mw = OffpeakMWh_epad / Ho
```

If `Ho = 0`, do not divide by zero. Mark the row invalid with warning.

### Step 2: derive modern peak layer

System dimension:

```text
modern_peak_sys_mw = A_sys - modern_base_sys_mw
```

EPAD dimension:

```text
modern_peak_epad_mw = A_epad - modern_base_epad_mw
```

Modern peak MW may be positive, zero or negative.

## Modern Projected Transaction rows

For each calloff/month, create four projected rows:

```text
component = modern.base.sys
mw = modern_base_sys_mw
price = modern_base_sys_price
```

```text
component = modern.base.epad
mw = modern_base_epad_mw
price = modern_base_epad_price
```

```text
component = modern.peak.sys
mw = modern_peak_sys_mw
price = modern_peak_sys_price
```

```text
component = modern.peak.epad
mw = modern_peak_epad_mw
price = modern_peak_epad_price
```

## Modern projected price calculations

Prices must preserve canonical value per dimension.

### Canonical values per dimension

System:

```text
canonical_base_sys_mwh = B_sys * H
canonical_peak_sys_mwh = P_sys * Hp
canonical_sys_value =
  canonical_base_sys_mwh * base.sys.price
  + canonical_peak_sys_mwh * peak.sys.price
```

EPAD:

```text
canonical_base_epad_mwh = B_epad * H
canonical_peak_epad_mwh = P_epad * Hp
canonical_epad_value =
  canonical_base_epad_mwh * base.epad.price
  + canonical_peak_epad_mwh * peak.epad.price
```

### Modern MWh per dimension

System:

```text
modern_base_sys_mwh = modern_base_sys_mw * H
modern_peak_sys_mwh = modern_peak_sys_mw * Hp
```

EPAD:

```text
modern_base_epad_mwh = modern_base_epad_mw * H
modern_peak_epad_mwh = modern_peak_epad_mw * Hp
```

### Base price rule

Base price is anchored to canonical base price per dimension:

```text
modern_base_sys_price = base.sys.price
modern_base_epad_price = base.epad.price
```

### Peak price residual rule

Peak price is residual and value-preserving per dimension.

System:

```text
modern_peak_sys_price =
  (canonical_sys_value - modern_base_sys_mwh * modern_base_sys_price)
  / modern_peak_sys_mwh
```

EPAD:

```text
modern_peak_epad_price =
  (canonical_epad_value - modern_base_epad_mwh * modern_base_epad_price)
  / modern_peak_epad_mwh
```

If `modern_peak_*_mwh = 0`, set `modern_peak_*_price` to blank/null and show warning. Do not divide by zero.

If `modern_peak_*_mwh` is negative, the formula still applies.

## Value preservation checks

For every calloff/month/dimension:

System:

```text
modern_base_sys_mwh * modern_base_sys_price
+ modern_peak_sys_mwh * modern_peak_sys_price
= canonical_sys_value
```

EPAD:

```text
modern_base_epad_mwh * modern_base_epad_price
+ modern_peak_epad_mwh * modern_peak_epad_price
= canonical_epad_value
```

Total:

```text
modern_total_value = canonical_sys_value + canonical_epad_value
```

## Modern Projected Calloff calculations

Modern Projected Calloffs should aggregate the Modern Projected Transactions by calloff.

For each calloff:

```text
base_mwh = sum(mwh for modern.base.sys + modern.base.epad?)
```

Important: do not double-count sys and epad as physical volume.

Use `modern.base.sys` as the physical volume carrier for base_mwh, and warn if `modern.base.sys.mwh` and `modern.base.epad.mwh` differ.

```text
base_mwh = sum(modern_base_sys_mwh over months)
peak_mwh = sum(modern_peak_sys_mwh over months)
```

Prices are all-in prices from sys + epad values, not simple component label values.

For each month:

```text
modern_base_all_in_price_month = modern_base_sys_price + modern_base_epad_price
modern_peak_all_in_price_month = modern_peak_sys_price + modern_peak_epad_price
modern_base_value_month = modern_base_sys_mwh * modern_base_sys_price + modern_base_epad_mwh * modern_base_epad_price
modern_peak_value_month = modern_peak_sys_mwh * modern_peak_sys_price + modern_peak_epad_mwh * modern_peak_epad_price
```

Aggregated calloff fields:

```text
base_value = sum(modern_base_value_month)
peak_value = sum(modern_peak_value_month)
total_value = base_value + peak_value
base_price = base_value / base_mwh
peak_price = peak_value / peak_mwh
```

If `base_mwh = 0`, set `base_price` blank/null and warn.

If `peak_mwh = 0`, set `peak_price` blank/null and warn.

If `peak_mwh` is negative, the same formula applies.

`period_start` is the first month in the calloff.

`period_end` is the last month in the calloff.

`date` is the calloff date.

## Worked example

Input for one calloff/month:

```text
calloff_id = C1
month = 2027-01
H = 744
Hp = 320
Ho = 424
B_sys = 0.1344086022
B_epad = 0.1344086022
A_sys = 0.15625
A_epad = 0.15625
P_sys = 0.0218413978
P_epad = 0.0218413978
base.sys.price = 70
base.epad.price = 15
peak.sys.price = 20
peak.epad.price = 2
```

Modern projected MW:

```text
modern_base_sys_mw = (0.1344086022 * 744 - 0.15625 * 320) / 424
                   = 0.1179245283
modern_base_epad_mw = 0.1179245283
modern_peak_sys_mw = 0.15625 - 0.1179245283
                   = 0.0383254717
modern_peak_epad_mw = 0.0383254717
```

Modern projected MWh:

```text
modern_base_sys_mwh = 0.1179245283 * 744 = 87.7358491
modern_peak_sys_mwh = 0.0383254717 * 320 = 12.2641510
```

Canonical values:

```text
canonical_sys_value = (0.1344086022 * 744 * 70) + (0.0218413978 * 320 * 20)
canonical_epad_value = (0.1344086022 * 744 * 15) + (0.0218413978 * 320 * 2)
```

Projected prices:

```text
modern_base_sys_price = 70
modern_base_epad_price = 15
modern_peak_sys_price =
  (canonical_sys_value - modern_base_sys_mwh * 70) / modern_peak_sys_mwh
modern_peak_epad_price =
  (canonical_epad_value - modern_base_epad_mwh * 15) / modern_peak_epad_mwh
```

Expected Modern Projected Transactions:

```text
C1 | 2027-01 | modern.base.sys  | 0.1179245283 | 70
C1 | 2027-01 | modern.base.epad | 0.1179245283 | 15
C1 | 2027-01 | modern.peak.sys  | 0.0383254717 | residual sys price
C1 | 2027-01 | modern.peak.epad | 0.0383254717 | residual epad price
```

## Negative peak example

If `modern_peak_sys_mw` or `modern_peak_epad_mw` is negative, show negative MW.

Do not reject.

Apply the same residual price formula.

## UI / Data Viewer placement

If implemented in Data Viewer, add these as projected views:

```text
Modern Projected Calloffs
Modern Projected Transactions
```

They must be visually or textually distinct from raw canonical data views.

Raw canonical Data Viewer should continue to show actual stored canonical transactions.

## Documentation

Create or update:

```text
docs/hedging/modern_projected_model.md
docs/hedging/modern_projected_transactions.md
docs/hedging/modern_projected_calloffs.md
```

Document:

- why modern projected rows use `modern.*` component names,
- difference between canonical `base/peak` and projected `modern.base/modern.peak`,
- transaction fields and formulas,
- calloff fields and aggregation formulas,
- value preservation per dimension,
- negative modern peak behavior,
- why sys/epad are not summed as physical volume.

## Tests

Add or update tests for:

1. Modern Projected Transactions view exists,
2. Modern Projected Calloffs view exists,
3. projected transaction columns are `calloff_id`, `month`, `component`, `mw`, `price`,
4. projected transaction component names are exactly:
   - `modern.base.sys`
   - `modern.base.epad`
   - `modern.peak.sys`
   - `modern.peak.epad`,
5. canonical component names are not used in the projected transaction `component` column,
6. projected base MW is calculated from offpeak level, not copied from canonical `base.sys.mw`,
7. projected peak MW is calculated as allocation peak level minus projected base level, not copied from canonical `peak.sys.mw`,
8. base projected prices equal canonical base prices per dimension,
9. peak projected prices are residual/value-preserving per dimension,
10. projected sys value equals canonical sys value,
11. projected epad value equals canonical epad value,
12. negative modern peak MW is allowed,
13. zero peak MWh does not divide by zero,
14. Modern Projected Calloffs aggregate from Modern Projected Transactions,
15. Modern Projected Calloffs do not double-count sys and epad as physical volume,
16. all-in base and peak prices are value-weighted,
17. raw Data Viewer still shows canonical rows separately.

## Non-goals

Do not change:

- canonical transaction generation,
- P0029/P0030 customer calloff list columns unless needed to avoid contradictions,
- market projection,
- settlement,
- Profiles projections,
- product migration UI.

This package is only about the modern projected logical data model.

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
- whether P0031 was replaced, corrected, or superseded,
- Modern Projected Transactions output example,
- Modern Projected Calloffs output example,
- value preservation checks,
- negative peak behavior,
- docs created/updated,
- tests run and result,
- `REPOSITORY_FILES.md` status.
