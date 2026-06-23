# P0028 - Split allocation.peak into sys/epad components

## Purpose

Update the canonical Peaks component model so the helper/allocation component is split by price/risk dimension:

```text
allocation.peak.sys
allocation.peak.epad
```

instead of a single shared:

```text
allocation.peak
```

This is a controlled model-alignment package.

## Background

P0025 introduced `allocation.peak` as a helper component carrying the customer's actual peak-hour MW.

P0027 simplified peak hedge/risk components from `peak.premium.*` to:

```text
peak.sys
peak.epad
```

To keep the canonical component model symmetric and explicit across system and EPAD dimensions, allocation should also be split:

```text
allocation.peak.sys -> input/bridge for peak.sys
allocation.peak.epad -> input/bridge for peak.epad
```

Both allocation rows normally carry the same MW, but they should exist as separate component rows so each priced peak component has an explicit dimension-specific allocation bridge.

## Target canonical Peaks component set

Replace target set:

```text
allocation.peak
base.sys
base.epad
peak.sys
peak.epad
```

with:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

## Component semantics

### allocation.peak.sys

```text
component_category = allocation
price_dimension = sys
hour_basis = peak_h
price = 0
q_factor = 0
market projection = excluded
customer projection = included
internal projection = included
```

Carries customer peak-hour MW used as the allocation bridge for `peak.sys`.

### allocation.peak.epad

```text
component_category = allocation
price_dimension = epad
hour_basis = peak_h
price = 0
q_factor = 0
market projection = excluded
customer projection = included
internal projection = included
```

Carries customer peak-hour MW used as the allocation bridge for `peak.epad`.

### Important physical-volume rule

Do not sum `allocation.peak.sys` and `allocation.peak.epad` as physical customer volume.

They are two dimension-specific helper rows for the same underlying peak-hour customer volume, exactly as `base.sys` and `base.epad` are two price dimensions on the same base volume.

## Forecast to canonical MW formulas

For each forecast month:

```text
F  = forecast_mwh
h  = hedge_pct
p  = peak_pct
H  = total_h
Hp = peak_h
```

Base:

```text
base_mw = F * h / H
```

Allocation peak:

```text
allocation_peak_mw = F * h * p / Hp
```

Peak component:

```text
peak_mw = allocation_peak_mw - base_mw
```

Generated rows:

```text
allocation.peak.sys.mw  = allocation_peak_mw
allocation.peak.epad.mw = allocation_peak_mw
base.sys.mw             = base_mw
base.epad.mw            = base_mw
peak.sys.mw             = allocation.peak.sys.mw  - base.sys.mw
peak.epad.mw            = allocation.peak.epad.mw - base.epad.mw
```

`peak.sys.mw` and `peak.epad.mw` may be positive, zero or negative.

## Price and q-factor rules

Allocation components:

```text
allocation.peak.sys.price = 0
allocation.peak.epad.price = 0
allocation.peak.sys.q_factor = 0
allocation.peak.epad.q_factor = 0
```

Therefore:

```text
allocation rows create no financial value
allocation rows create no market position
```

Base and peak rows remain priced and q-factor relevant.

## Projection listener rules

Use component category, not literal component name, for projection inclusion.

Customer projections:

```text
include allocation, base, peak, profile, volume, currency
exclude adjustment/internal-only components
```

Market projection:

```text
include base, peak, profile
exclude allocation
```

Internal projection / raw data:

```text
include all components
```

## Legacy Calloff List changes

Update the P0026 `Peaks.Classic` Legacy Calloff List logic.

Instead of reading:

```text
allocation.peak
```

read dimension-specific allocation rows.

For customer volume projection, use one effective allocation peak MW.

Normal case:

```text
allocation.peak.sys.mw == allocation.peak.epad.mw
```

Then:

```text
allocation_peak_mw = allocation.peak.sys.mw
```

If they differ beyond tolerance:

- show a data-quality warning,
- use `allocation.peak.sys` as the customer volume carrier,
- keep internal/raw views unchanged.

Legacy volume formulas remain:

```text
base_mwh = base_mw * total_h
legacy_peak_mw = allocation_peak_mw
legacy_peak_mwh = allocation_peak_mw * peak_h
legacy_offpeak_mwh = base_mwh - legacy_peak_mwh
legacy_offpeak_mw = legacy_offpeak_mwh / offpeak_h
```

Do not display `allocation.peak.sys` or `allocation.peak.epad` as separate customer rows in the Legacy Calloff List. They are inputs to the projection.

## Modern Projection note

Modern Projection is not implemented in this package, but it should eventually be able to show:

```text
base.sys/base.epad
peak.sys/peak.epad
customer peak level derived from allocation.peak.sys/allocation.peak.epad
```

If a single customer peak MW is needed in Modern Projection, use the same effective allocation rule as Legacy Calloff List.

## Compatibility aliases

During transition, support old allocation code as alias:

```text
allocation.peak -> allocation.peak.sys and allocation.peak.epad
```

Alias behavior:

- old `allocation.peak` rows may be read as both sys and epad allocation when no split rows exist,
- new rows must be written as `allocation.peak.sys` and `allocation.peak.epad`,
- docs must mark `allocation.peak` as deprecated alias,
- no new seed data should use unsuffixed `allocation.peak`.

## Expected row count per Peaks forecast hedge month

After this package, each Peaks package forecast hedge month should create six canonical rows:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

This replaces the five-row target from P0025/P0027.

## Worked example

Input:

```text
forecast_mwh = 100
hedge_pct = 1.0
peak_pct = 0.50
total_h = 744
peak_h = 320
```

Expected:

```text
base_mw = 100 / 744 = 0.1344086022
allocation_peak_mw = 100 * 0.50 / 320 = 0.15625
peak_mw = 0.15625 - 0.1344086022 = 0.0218413978
```

Rows:

```text
allocation.peak.sys   mw = 0.15625       price = 0 q_factor = 0
allocation.peak.epad  mw = 0.15625       price = 0 q_factor = 0
base.sys              mw = 0.1344086022  priced    q_factor = base q
base.epad             mw = 0.1344086022  priced    q_factor = base q
peak.sys              mw = 0.0218413978  priced    q_factor = peak q
peak.epad             mw = 0.0218413978  priced    q_factor = peak q
```

Negative case:

```text
forecast_mwh = 100
hedge_pct = 1.0
peak_pct = 0.35
total_h = 744
peak_h = 320
```

Expected:

```text
allocation_peak_mw = 100 * 0.35 / 320 = 0.109375
peak_mw = 0.109375 - 0.1344086022 = -0.0250336022
```

Rows:

```text
allocation.peak.sys   mw = 0.109375
allocation.peak.epad  mw = 0.109375
peak.sys              mw = -0.0250336022
peak.epad             mw = -0.0250336022
```

Negative peak rows are valid.

## Required implementation

1. Update component vocabulary / constants / seed data to include:

```text
allocation.peak.sys
allocation.peak.epad
```

2. Deprecate unsuffixed:

```text
allocation.peak
```

as compatibility alias only.

3. Update forecast hedge generation for Peaks packages to create six rows per month:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

4. Update formulas:

```text
allocation.peak.sys.mw = allocation_peak_mw
allocation.peak.epad.mw = allocation_peak_mw
peak.sys.mw = allocation.peak.sys.mw - base.sys.mw
peak.epad.mw = allocation.peak.epad.mw - base.epad.mw
```

5. Update market projection filtering to exclude both allocation rows via category `allocation`.

6. Update customer projection logic where it reads allocation peak value:

```text
read allocation.peak.sys/allocation.peak.epad
warn if mismatch
use sys as effective customer volume carrier if mismatch
```

7. Update Data Viewer/internal views to show split allocation rows.

8. Update docs created by P0025-P0027.

## Documentation updates

Update or create documentation to reflect the split:

```text
docs/hedging/canonical_component_model.md
docs/hedging/component_categories_and_projection_listeners.md
docs/hedging/peaks_classic_legacy_calloff_list.md
docs/hedging/product_packages_and_feature_sets.md
```

Required wording:

```text
The canonical Peaks component set is allocation.peak.sys, allocation.peak.epad, base.sys, base.epad, peak.sys and peak.epad.

allocation.peak.sys and allocation.peak.epad are dimension-specific helper/allocation rows. They normally carry the same MW. They have price 0 and q-factor 0. They must not be summed as physical customer volume.
```

## Tests

Add or update tests for:

1. component vocabulary contains `allocation.peak.sys` and `allocation.peak.epad`,
2. component vocabulary no longer requires unsuffixed `allocation.peak` as target,
3. `allocation.peak.sys` category is `allocation`,
4. `allocation.peak.epad` category is `allocation`,
5. both allocation split components have price 0,
6. both allocation split components have q_factor 0,
7. market projection excludes both allocation split components,
8. internal/raw data views include both allocation split components,
9. Peaks forecast hedge creates six rows per month,
10. positive example creates expected MW values,
11. negative example creates expected negative `peak.sys` and `peak.epad` MW,
12. Legacy Calloff List uses allocation split rows to derive customer peak MW,
13. Legacy Calloff List does not display allocation split rows directly,
14. mismatch between allocation.peak.sys and allocation.peak.epad creates warning,
15. old `allocation.peak` alias can be read if old fixture rows remain,
16. no physical volume calculation sums allocation.peak.sys + allocation.peak.epad.

## Non-goals

Do not redesign:

- product package hierarchy,
- peak.sys/peak.epad naming,
- Classic price projection beyond reading split allocation rows,
- Modern Projection UI,
- settlement,
- market adjustment components.

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
- component vocabulary changes,
- whether `allocation.peak` alias remains,
- forecast hedge row count per month,
- positive/negative example results,
- market projection behavior,
- Legacy Calloff List behavior,
- Data Viewer/internal behavior,
- tests run and result,
- `REPOSITORY_FILES.md` status.
