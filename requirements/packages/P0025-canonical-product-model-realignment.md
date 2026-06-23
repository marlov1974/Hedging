# P0025 - Canonical Product Model Realignment

## Purpose

Realign the PoC from product-specific component thinking to a shared canonical component model used by all Portfolio Hedging Products.

This is an architecture and controlled-refactor package. It is not a free-form rewrite. Implement the minimum code and seed-data changes needed to establish the new model without breaking existing PoC flows.

## Background

Earlier packages used names such as `PeaksModern` and `PeaksClassic` partly as products and partly as internal models. This has created conceptual drift.

The corrected view is:

```text
Product family = Portfolio Hedging Products
Product packages = Baseloads, Peaks.Classic, Peaks.Modern, Profiles.Classic, Profiles.Modern
Feature sets = customer-facing experience and workflows tied to a product package
Canonical model = shared internal component/position model
Market projection = internal/market-facing projection from canonical components
```

`Peaks.Classic` and `Peaks.Modern` may be mathematically, risk-wise and trading-wise equivalent. They differ because customer contracts describe the service differently and therefore the customer must experience the product differently.

## Target terminology

### Product family

Use:

```text
Portfolio Hedging Products
```

This family contains all portfolio hedging product packages.

### Product packages

Use these product package names:

```text
Baseloads
Peaks.Classic
Peaks.Modern
Profiles.Classic
Profiles.Modern
```

Do not use `PeaksModern` or `PeaksClassic` as standalone product names in new code or documentation. If old names remain for compatibility, mark them as aliases/deprecated.

### Feature sets

A product package includes or selects a feature set.

```text
Peaks.Classic -> Classic Feature Set
Peaks.Modern  -> Modern Feature Set
```

Classic Feature Set presents the product in Peak/Offpeak terms.

Modern Feature Set presents the product in Base/Peak terms.

### Projections

A projection is a feature-set-specific presentation of the canonical model.

```text
Classic Feature Set -> Legacy Projection / Peak-Offpeak views
Modern Feature Set  -> Modern Projection / Base-Peak views
Market Projection   -> market/trading/internal hedge view
```

Legacy Projection is part of the Classic Feature Set, not a separate product model.

Modern Projection is part of the Modern Feature Set, not a separate product model.

Market Projection is separate from customer feature sets and is used for market/hedge position generation and internal follow-up.

## Canonical component model

The canonical model stores component transactions in MW.

MWh is always a projection using the component hour basis and the trading calendar.

```text
component_mwh = component_mw * relevant_hours
```

Each component must have a component category and an hour basis.

## Component categories

Add or document these component categories:

```text
allocation
base
peak
profile
volume
currency
adjustment
```

### Default projection listeners by category

Projection inclusion should be derived from component category in the first PoC version.

```text
Customer projections:
- include all customer-relevant components
- include allocation, base, peak, profile, volume, currency
- exclude adjustment/internal-only components

Market projection:
- include base, peak, profile
- ignore allocation
- ignore customer-only helper components
- do not include adjustment unless a later package explicitly defines a market adjustment category

Internal projection:
- include everything
```

Do not implement a heavy per-transaction visibility framework in this package. Component category is enough for the PoC.

## Core component vocabulary

Use the following canonical components for the Peaks PoC:

```text
allocation.peak
base.sys
base.epad
peak.premium.sys
peak.premium.epad
```

Continue to reserve or retain these broader portfolio components where they already exist:

```text
profile.sys
profile.epad
volume
currency.sek
adjustment.*
```

### allocation.peak

`allocation.peak` is a helper/allocation component.

It answers:

```text
What is the customer's peak-hour effect according to forecast/calloff?
```

It is stored in MW and uses `peak_h` as hour basis.

It has:

```text
component_category = allocation
hour_basis = peak_h
price = 0
q_factor = 0
market_quantity = 0
customer projection = included
market projection = excluded
internal projection = included
```

It is not a hedge component and must not produce market quantity or financial value.

### base.sys / base.epad

Base components describe the flat total monthly hedge.

They are stored in MW and use `total_h` as hour basis.

```text
base_mw = forecast_mwh * hedge_pct / total_h
```

Both `base.sys` and `base.epad` use the same base MW.

They are priced and market-relevant.

### peak.premium.sys / peak.premium.epad

Peak premium components describe the positive or negative peak shape above flat base.

They are stored in MW and use `peak_h` as hour basis.

```text
peak_premium_mw = allocation_peak_mw - base_mw
```

This may be negative.

Both `peak.premium.sys` and `peak.premium.epad` use the same peak premium MW.

They are priced and market-relevant.

## Forecast to canonical MW formulas

For each forecast month:

```text
F  = forecast_mwh
h  = hedge_pct
p  = peak_pct
H  = total_h
Hp = peak_h
Ho = offpeak_h
```

Base:

```text
base_mw = F * h / H
```

Allocation peak:

```text
allocation_peak_mw = F * h * p / Hp
```

Peak premium:

```text
peak_premium_mw = allocation_peak_mw - base_mw
```

Equivalent MWh formulas:

```text
base_mwh = base_mw * H
allocation_peak_mwh = allocation_peak_mw * Hp
peak_premium_mwh = peak_premium_mw * Hp
```

Alternative compact peak premium MWh formula:

```text
peak_premium_mwh = F * h * (p - Hp / H)
```

Negative `peak_premium_mw` and negative `peak_premium_mwh` are valid and must be allowed.

## Example data

Use this positive peak-heavy example in tests and docs:

```text
month = 2027-01
forecast_mwh = 100
hedge_pct = 1.0
peak_pct = 0.50
total_h = 744
peak_h = 320
offpeak_h = 424
```

Expected:

```text
base_mw = 100 / 744 = 0.1344086022
allocation_peak_mw = 100 * 0.50 / 320 = 0.15625
peak_premium_mw = 0.15625 - 0.1344086022 = 0.0218413978
```

Stored canonical component rows for the month should include:

```text
allocation.peak       mw = 0.15625       price = 0      q_factor = 0
base.sys              mw = 0.1344086022  price = priced q_factor = base q
base.epad             mw = 0.1344086022  price = priced q_factor = base q
peak.premium.sys      mw = 0.0218413978  price = priced q_factor = peak q
peak.premium.epad     mw = 0.0218413978  price = priced q_factor = peak q
```

Use this negative peak-light example in tests and docs:

```text
month = 2027-01
forecast_mwh = 100
hedge_pct = 1.0
peak_pct = 0.35
total_h = 744
peak_h = 320
offpeak_h = 424
```

Expected:

```text
base_mw = 100 / 744 = 0.1344086022
allocation_peak_mw = 100 * 0.35 / 320 = 0.109375
peak_premium_mw = 0.109375 - 0.1344086022 = -0.0250336022
```

## Product package behavior

### Baseloads

Baseloads should primarily use:

```text
base.sys
base.epad
```

If needed for customer projections, `allocation.peak` may be generated using a flat profile:

```text
allocation_peak_mw = base_mw
```

Do not create peak premium components for a flat Baseloads position unless explicitly hedged.

### Peaks.Classic

Peaks.Classic is a product package under Portfolio Hedging Products.

It uses Classic Feature Set.

Customer experience and customer-facing calloff/position views are Peak/Offpeak.

Under the hood it must map to the canonical model.

Classic/Legacy projection should derive:

```text
legacy_peak_mw = allocation_peak_mw
legacy_peak_mwh = allocation_peak_mw * peak_h
legacy_offpeak_mwh = base_mw * total_h - legacy_peak_mwh
legacy_offpeak_mw = legacy_offpeak_mwh / offpeak_h
```

### Peaks.Modern

Peaks.Modern is a product package under Portfolio Hedging Products.

It uses Modern Feature Set.

Customer experience and customer-facing calloff/position views are Base/Peak.

Under the hood it must map to the same canonical model.

Modern projection should show:

```text
base_mw
base_mwh
allocation_peak_mw or peak total effect where useful
peak_premium_mw
peak_premium_mwh
```

The exact Modern Projection UI will be built in a later package.

### Profiles.Classic / Profiles.Modern

Do not fully rebuild Profiles in this package.

Reserve the same pattern:

```text
Profiles.Classic -> Classic-style customer feature set
Profiles.Modern -> Modern-style customer feature set
shared canonical model underneath
```

Profile components remain in the broader vocabulary:

```text
profile.sys
profile.epad
volume
```

## Market projection rules

Market projection must listen only to market-relevant component categories:

```text
base
peak
profile
```

For now, ignore:

```text
allocation
currency
volume
adjustment
```

unless existing code already has explicit behavior for currency/volume. Do not invent new market behavior for them in this package.

Market quantity uses q-factor:

```text
market_mw = component_mw * q_factor
market_mwh = market_mw * component_hour_basis
```

`allocation.peak` must never create market position because:

```text
q_factor = 0
category = allocation
market projection excludes allocation
```

## Price rules

In this package, do not implement full Classic or Modern projected price logic unless the existing feature requires a small compatibility fix.

Keep this rule documented:

```text
allocation.peak has price = 0 and value = 0
base.* and peak.premium.* are priced hedge/risk components
```

Future packages will define customer-facing projected prices for Classic and Modern feature sets.

## Required implementation scope

Implement the minimum safe changes to establish the new model:

1. Add/update component vocabulary with:
   - `allocation.peak`
   - `base.sys`
   - `base.epad`
   - `peak.premium.sys`
   - `peak.premium.epad`

2. Add/update component category metadata:
   - allocation
   - base
   - peak
   - profile
   - volume
   - currency
   - adjustment

3. Replace `peak.modern.*` in current Peaks forecast hedge logic with `peak.premium.*` where practical.
   - If a full rename is too invasive, add a compatibility alias and document the migration.
   - New generated transactions should use `peak.premium.sys` and `peak.premium.epad`.

4. Generate `allocation.peak` rows for Peaks forecast hedge calloffs.
   - MW = `forecast_mwh * hedge_pct * peak_pct / peak_h`
   - price = 0
   - q_factor = 0

5. Generate `base.sys` and `base.epad` rows using:
   - MW = `forecast_mwh * hedge_pct / total_h`

6. Generate `peak.premium.sys` and `peak.premium.epad` rows using:
   - MW = `allocation_peak_mw - base_mw`
   - allow negative MW

7. Update any market projection/report code so market projection excludes `allocation` category and includes `base`, `peak`, `profile` categories.

8. Update the Data Viewer if needed so internal/raw views can still show all rows, including allocation.

9. Keep customer-facing existing features working as much as possible, but do not rebuild full Classic and Modern feature sets in this package.

## Required documentation

Create or update these docs:

```text
docs/hedging/portfolio_hedging_product_family.md
docs/hedging/canonical_component_model.md
docs/hedging/product_packages_and_feature_sets.md
docs/hedging/component_categories_and_projection_listeners.md
```

They must explain:

- Portfolio Hedging Products as product family,
- product packages as Baseloads, Peaks.Classic, Peaks.Modern, Profiles.Classic, Profiles.Modern,
- difference between product package, feature set, projection, and canonical model,
- allocation.peak as helper/allocation component,
- allocation.peak has MW but no price and q-factor 0,
- base components carry flat total hedge,
- peak.premium components carry positive/negative shape above flat base,
- markets listen to base, peak, profile,
- customer listens to all customer-relevant components except adjustment,
- internal listens to all components.

## Tests

Add or update tests for:

1. component vocabulary contains `allocation.peak`, `base.sys`, `base.epad`, `peak.premium.sys`, `peak.premium.epad`,
2. `allocation.peak` category is `allocation`,
3. `allocation.peak` price is 0,
4. `allocation.peak` q-factor is 0,
5. `allocation.peak` does not appear in market projection,
6. internal/raw data views can show `allocation.peak`,
7. market projection includes `base.sys`, `base.epad`, `peak.premium.sys`, `peak.premium.epad`,
8. market projection uses q-factor for base and peak components,
9. forecast hedge creates five rows per month for Peaks packages:
   - allocation.peak
   - base.sys
   - base.epad
   - peak.premium.sys
   - peak.premium.epad
10. positive example produces expected MW values,
11. negative example produces negative `peak.premium.*` MW and does not reject it,
12. flat peak share `peak_pct = peak_h / total_h` produces zero `peak.premium.*` MW,
13. no customer or market calculation sums `base.sys` and `base.epad` as physical volume,
14. product package names are updated or aliased as specified.

## Migration / compatibility

If current seed data or UI still uses old product names, preserve compatibility through aliases for now:

```text
PeaksModern -> Peaks.Modern
PeaksClassic -> Peaks.Classic
peak.modern.sys -> peak.premium.sys
peak.modern.epad -> peak.premium.epad
```

Aliases must be documented as temporary.

New code, new seed data and new docs should use the target names.

## Non-goals

Do not fully implement these in this package:

- full Legacy Calloff List projected pricing,
- full Modern Projection UI,
- complete Profiles refactor,
- full product migration UI,
- market adjustment components,
- settlement redesign.

These will be handled by later packages.

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
- product package naming changes,
- whether aliases were needed,
- forecast hedge row count per month,
- positive/negative/flat test results,
- market projection filtering behavior,
- docs created/updated,
- tests run and result,
- `REPOSITORY_FILES.md` status.
