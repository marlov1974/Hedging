# P0027 - Rename peak.premium.* to peak.*

## Purpose

Update the canonical component vocabulary so peak components are named neutrally as `peak.sys` and `peak.epad` instead of `peak.premium.sys` and `peak.premium.epad`.

This is a controlled rename package.

## Background

P0025 and P0026 introduced `peak.premium.sys` and `peak.premium.epad` to make clear that the component was not the customer's full peak consumption, but the canonical peak component above flat base.

The model has now been clarified:

- `allocation.peak` carries the customer's actual peak-hour effect as a helper/allocation component.
- `base.*` carries the flat base hedge for the total monthly volume.
- `peak.*` carries the canonical peak component relative to flat base.

Because `allocation.peak` now explains the customer's peak-hour volume, the canonical hedge/risk component no longer needs the word `premium` in its name.

The target canonical components for Peaks are now:

```text
allocation.peak
base.sys
base.epad
peak.sys
peak.epad
```

## Target component vocabulary

Replace new canonical usage of:

```text
peak.premium.sys
peak.premium.epad
```

with:

```text
peak.sys
peak.epad
```

## Component semantics

### allocation.peak

No change.

```text
component_code = allocation.peak
component_category = allocation
hour_basis = peak_h
price = 0
q_factor = 0
customer projection = included
market projection = excluded
internal projection = included
```

`allocation.peak` represents the customer's actual peak-hour MW from forecast/calloff.

Formula:

```text
allocation_peak_mw = forecast_mwh * hedge_pct * peak_pct / peak_h
```

### base.sys / base.epad

No change.

```text
component_category = base
hour_basis = total_h
price = priced
q_factor = base q-factor
customer projection = included
market projection = included
internal projection = included
```

Formula:

```text
base_mw = forecast_mwh * hedge_pct / total_h
```

### peak.sys / peak.epad

Rename from `peak.premium.*`.

```text
component_category = peak
hour_basis = peak_h
price = priced
q_factor = peak q-factor
customer projection = included
market projection = included
internal projection = included
```

Formula:

```text
peak_mw = allocation_peak_mw - base_mw
```

`peak_mw` may be positive, zero or negative.

This component is still the canonical peak component relative to flat base. The shorter name does not mean it is the customer's full peak consumption. Full customer peak consumption is represented by `allocation.peak`.

## Required implementation

1. Update component vocabulary / seed data / constants / metadata from:

```text
peak.premium.sys
peak.premium.epad
```

to:

```text
peak.sys
peak.epad
```

2. Update forecast hedge generation for Peaks packages so new transactions use:

```text
allocation.peak
base.sys
base.epad
peak.sys
peak.epad
```

Per month, five canonical rows should be created.

3. Update formulas so:

```text
base_mw = forecast_mwh * hedge_pct / total_h
allocation_peak_mw = forecast_mwh * hedge_pct * peak_pct / peak_h
peak_mw = allocation_peak_mw - base_mw
```

Transactions:

```text
allocation.peak.mw = allocation_peak_mw
base.sys.mw = base_mw
base.epad.mw = base_mw
peak.sys.mw = peak_mw
peak.epad.mw = peak_mw
```

4. Update all market projection filtering so market listens to category `peak`, not to the literal `peak.premium` prefix.

5. Update Peaks.Classic Legacy Calloff List logic from P0026:

Old:

```text
peak_premium_price = peak.premium.sys.price + peak.premium.epad.price
peak_premium_mw = peak.premium.*.mw
```

New:

```text
peak_price = peak.sys.price + peak.epad.price
peak_mw = peak.*.mw
```

The projected price logic remains the same, only the name changes.

6. Update docs created by P0025/P0026 to use `peak.sys` and `peak.epad` as the canonical target names.

7. Update UI labels only where they leak internal component codes. Customer-facing Modern/Classic labels should remain business-friendly:

```text
Base
Peak
Peak/Offpeak
```

Avoid showing `premium` to customers unless a doc explicitly explains historic terminology.

## Compatibility aliases

For compatibility, support old component codes as aliases during migration:

```text
peak.premium.sys -> peak.sys
peak.premium.epad -> peak.epad
peak.modern.sys -> peak.sys
peak.modern.epad -> peak.epad
```

Alias behavior:

- Existing old rows should still be readable.
- New rows should be written with `peak.sys` and `peak.epad`.
- Documentation should mark aliases as temporary compatibility only.
- Tests should verify alias reading if old fixture data remains.

## Documentation updates

Update any docs that currently describe the canonical Peaks component set.

Target wording:

```text
The canonical Peaks component set is allocation.peak, base.sys, base.epad, peak.sys and peak.epad.

allocation.peak represents the customer's actual peak-hour MW and is an allocation/helper component with price 0 and q-factor 0.

peak.sys and peak.epad are the canonical peak hedge/risk components relative to flat base. Their MW equals allocation_peak_mw - base_mw and may be negative.
```

Docs likely affected:

```text
docs/hedging/canonical_component_model.md
docs/hedging/component_categories_and_projection_listeners.md
docs/hedging/portfolio_hedging_product_family.md
docs/hedging/product_packages_and_feature_sets.md
docs/hedging/peaks_classic_legacy_calloff_list.md
docs/hedging/classic_projection_price_rules.md
```

If some files do not exist yet because P0025/P0026 is still running, update the docs that exist and document pending files in the package run report.

## Tests

Add or update tests for:

1. canonical Peaks component set contains:
   - `allocation.peak`
   - `base.sys`
   - `base.epad`
   - `peak.sys`
   - `peak.epad`

2. canonical Peaks component set does not require `peak.premium.sys` or `peak.premium.epad` as target names,

3. new forecast hedge calloffs create `peak.sys` and `peak.epad`, not `peak.premium.sys` and `peak.premium.epad`,

4. `peak.sys` and `peak.epad` have component category `peak`,

5. market projection includes `peak.sys` and `peak.epad`,

6. customer/internal projections can read `peak.sys` and `peak.epad`,

7. `peak_mw = allocation_peak_mw - base_mw`,

8. negative `peak_mw` is allowed,

9. compatibility alias maps `peak.premium.sys` to `peak.sys` where old data exists,

10. compatibility alias maps `peak.modern.sys` to `peak.sys` where old data exists,

11. Legacy Calloff List from P0026 still value-checks correctly after rename,

12. no physical volume calculation sums `base.sys` and `base.epad` as two separate customer volumes,

13. `allocation.peak` still has price 0 and q-factor 0,

14. market projection still excludes `allocation.peak`.

## Numeric example

Use the same example as P0025/P0026 with renamed peak components.

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
allocation.peak  mw = 0.15625       price = 0 q_factor = 0
base.sys         mw = 0.1344086022  priced    q_factor = base q
base.epad        mw = 0.1344086022  priced    q_factor = base q
peak.sys         mw = 0.0218413978  priced    q_factor = peak q
peak.epad        mw = 0.0218413978  priced    q_factor = peak q
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

## Non-goals

Do not redesign:

- Product family structure,
- Classic Feature Set logic beyond rename compatibility,
- Modern Feature Set UI,
- Market projection categories beyond updating to `peak.*`,
- settlement.

This package is a rename/semantic cleanup only.

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
- all occurrences changed from `peak.premium.*` to `peak.*`,
- aliases retained,
- whether old `peak.modern.*` compatibility remains,
- forecast hedge row names after change,
- market projection behavior,
- Legacy Calloff List behavior after rename,
- tests run and result,
- `REPOSITORY_FILES.md` status.
