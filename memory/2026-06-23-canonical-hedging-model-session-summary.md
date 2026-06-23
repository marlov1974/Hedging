# Canonical Hedging Model Session Summary - 2026-06-23

## Purpose of this memory file

This file stores the key decisions, terminology, formulas and package history from a long design session about the Portfolio Hedging Products PoC.

The content is intentionally generic and sanitized. It avoids real company names, internal strategies, customer identities, commercial secrets, actual market positions and confidential data.

Use this file as a continuity reference for later ChatGPT/Codex sessions.

## Core collaboration pattern

- ChatGPT designs, structures and writes requirements packages.
- Codex implements packages in the repository.
- Packages are stored under `requirements/packages/`.
- The PoC is allowed to reset/rebuild the database during current development.
- No production migration guarantees are required yet.
- Seed data is currently the source of truth after rebuilds.
- Compatibility aliases are for short-term code/test stability, not production migration.

## Repository

Repository used in this session:

```text
marlov1974/Hedging
```

The repo is treated as a generic/synthetic PoC. Avoid adding business-sensitive or organization-specific information.

## High-level model objective

The PoC should demonstrate that one canonical component model can support several product-package and feature-set perspectives over the same customer/portfolio/calloff data.

The canonical model must support:

- historical model compatibility,
- future model compatibility,
- customer/product movement without database administration,
- multiple customer-facing product packages over the same underlying data,
- market/trading projection,
- internal/raw analysis.

## Main conceptual layers

### Product family

```text
Portfolio Hedging Products
```

This is the product family.

### Product packages

Product packages are customer/contract/feature-set packagings under the product family:

```text
Baseloads
Peaks.Classic
Peaks.Modern
Profiles.Classic
Profiles.Modern
```

Product packages may be mathematically, risk-wise and trading-wise equivalent while still being different products from a customer/contract/user-experience perspective.

### Feature sets and perspectives

Feature sets describe how the customer or user experiences the product package.

Important perspectives:

```text
Baseloads
Classic
Modern
Canonical / raw
```

Classic means Peak/Offpeak.

Modern means Base/Peak, where:

```text
modern.base = offpeak level applied as base layer over the whole month
modern.peak = extra peak layer above modern.base during peak hours
```

Canonical means the stored internal component model.

### Projection

Projection means presenting the canonical source-of-truth data in a feature-specific view.

Examples:

```text
Canonical model -> Classic projection -> Offpeak/Peak customer view
Canonical model -> Modern projection -> modern.base/modern.peak customer view
Canonical model -> Modern projected transaction model -> modern.* rows
Canonical model -> Market projection -> market/trading position
```

Projected rows are not source-of-truth transactions.

## Canonical component model

All canonical component transactions are stored in MW.

MWh is always derived using the component's hour basis:

```text
component_mwh = component_mw * relevant_hours
```

### Canonical Peaks component set

Current target canonical component set for Peaks:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

### Component categories

```text
allocation
base
peak
profile
volume
currency
adjustment
```

### Projection listeners by category

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

Internal/raw projection:

```text
include everything
```

### Allocation components

```text
allocation.peak.sys
allocation.peak.epad
```

These are helper/allocation components.

They carry the customer's peak-hour MW by dimension.

They normally carry the same MW, but are split into sys/epad to stay symmetric with other components.

They have:

```text
category = allocation
hour_basis = peak_h
price = 0
q_factor = 0
market projection = excluded
customer projection = included
internal projection = included
```

They must not be summed as physical customer volume. They are two dimension-specific helper rows for the same underlying peak-hour level.

### Base components

```text
base.sys
base.epad
```

Canonical base means flat monthly average MW over the full month.

Formula:

```text
base_mw = forecast_mwh * hedge_pct / total_h
```

Both base dimensions normally use the same MW.

They are priced and q-factor relevant.

### Peak components

```text
peak.sys
peak.epad
```

Canonical peak means the peak component relative to flat canonical base.

Formula:

```text
peak_mw = allocation_peak_mw - base_mw
```

This may be positive, zero or negative.

The name is intentionally neutral: it does not mean full customer peak consumption. Full customer peak level is represented by allocation.peak.*.

### Deprecated / compatibility aliases

During migration, support old names where old fixtures or code remain:

```text
allocation.peak -> allocation.peak.sys/allocation.peak.epad
peak.premium.sys -> peak.sys
peak.premium.epad -> peak.epad
peak.modern.sys -> peak.sys
peak.modern.epad -> peak.epad
PeaksModern -> Peaks.Modern
PeaksClassic -> Peaks.Classic
```

New code/docs/seed data should use target names.

## Canonical forecast-to-component formulas

For each month:

```text
F  = forecast_mwh
h  = hedge_pct
p  = peak_pct
H  = total_h
Hp = peak_h
Ho = offpeak_h
```

Canonical base:

```text
base_mw = F * h / H
```

Allocation peak:

```text
allocation_peak_mw = F * h * p / Hp
```

Canonical peak:

```text
peak_mw = allocation_peak_mw - base_mw
```

Rows:

```text
allocation.peak.sys.mw  = allocation_peak_mw
allocation.peak.epad.mw = allocation_peak_mw
base.sys.mw             = base_mw
base.epad.mw            = base_mw
peak.sys.mw             = peak_mw
peak.epad.mw            = peak_mw
```

## Four projected MW values from canonical model

Canonical inputs per month:

```text
B = effective canonical base MW
A = effective allocation peak MW
P = effective canonical peak MW
H = total_h
Hp = peak_h
Ho = offpeak_h
```

Expected relation:

```text
A = B + P
P = A - B
```

Physical volumes:

```text
TotalMWh = B * H
PeakMWh = A * Hp
OffpeakMWh = TotalMWh - PeakMWh
```

Classic projection:

```text
ClassicOffpeakMW = OffpeakMWh / Ho
ClassicPeakMW = A
```

Equivalent:

```text
ClassicOffpeakMW = (B * H - A * Hp) / Ho
ClassicPeakMW = B + P
```

Modern projection:

```text
ModernBaseMW = ClassicOffpeakMW
ModernPeakMW = ClassicPeakMW - ModernBaseMW
```

Equivalent when canonical relation holds:

```text
ModernBaseMW = B - P * Hp / Ho
ModernPeakMW = P * H / Ho
```

Important distinction:

```text
Classic PeakMW = full peak level
Modern PeakMW = extra effect above Modern Base level
```

## Projection prices

Canonical all-in prices:

```text
CanonicalBasePrice = base.sys.price + base.epad.price
CanonicalPeakPrice = peak.sys.price + peak.epad.price
```

Canonical values:

```text
CanonicalBaseMWh = B * H
CanonicalPeakMWh = P * Hp
CanonicalBaseValue = CanonicalBaseMWh * CanonicalBasePrice
CanonicalPeakValue = CanonicalPeakMWh * CanonicalPeakPrice
CanonicalTotalValue = CanonicalBaseValue + CanonicalPeakValue
```

Classic prices:

```text
ClassicOffpeakPrice = CanonicalBasePrice
ClassicPeakPrice =
  (CanonicalTotalValue - ClassicOffpeakMWh * ClassicOffpeakPrice)
  / ClassicPeakMWh
```

Classic value check:

```text
ClassicOffpeakMWh * ClassicOffpeakPrice
+ ClassicPeakMWh * ClassicPeakPrice
= CanonicalTotalValue
```

Modern prices:

```text
ModernBasePrice = CanonicalBasePrice
ModernPeakPrice =
  (CanonicalTotalValue - ModernBaseMWh * ModernBasePrice)
  / ModernPeakMWh
```

Modern value check:

```text
ModernBaseMWh * ModernBasePrice
+ ModernPeakMWh * ModernPeakPrice
= CanonicalTotalValue
```

If denominators are zero, show blank/null and warning. Negative peak MWh is valid.

## Modern projected transaction model

Purpose: demonstrate compatibility with a modern-only optimized data model.

This is not raw canonical data.

Projected transaction columns:

```text
calloff_id
month
component
mw
price
```

Projected components:

```text
modern.base.sys
modern.base.epad
modern.peak.sys
modern.peak.epad
```

These are projection names only, not persisted source-of-truth component codes.

Modern projected meanings:

```text
modern.base.* = offpeak level applied as base layer over the whole month
modern.peak.* = extra peak effect above modern base during peak hours
```

Per dimension:

```text
modern_base_sys_mw = (B_sys * H - A_sys * Hp) / Ho
modern_base_epad_mw = (B_epad * H - A_epad * Hp) / Ho
modern_peak_sys_mw = A_sys - modern_base_sys_mw
modern_peak_epad_mw = A_epad - modern_base_epad_mw
```

Projected base prices equal canonical base prices per dimension:

```text
modern_base_sys_price = base.sys.price
modern_base_epad_price = base.epad.price
```

Projected peak prices are residual/value-preserving per dimension:

```text
modern_peak_sys_price =
  (canonical_sys_value - modern_base_sys_mwh * modern_base_sys_price)
  / modern_peak_sys_mwh
```

```text
modern_peak_epad_price =
  (canonical_epad_value - modern_base_epad_mwh * modern_base_epad_price)
  / modern_peak_epad_mwh
```

## Modern Projected Calloffs

Aggregated from Modern Projected Transactions.

Core columns:

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

Do not double-count sys and epad as physical volume. Use sys as physical volume carrier and warn if sys/epad projected MWh differ.

## Customer-facing calloff lists use MWh

Customer-facing calloff transaction lists display MWh, not MW.

Classic columns:

```text
Date
OffpeakMWh
PeakMWh
OffpeakPrice
PeakPrice
```

Modern columns:

```text
Date
BaseMWh
PeakMWh
BasePrice
PeakPrice
```

MW values may be used internally, but the customer-facing columns are MWh.

## Modern forecast and hedge forecast flow

Peaks.Modern Forecast and Hedge Forecast should be customer-facing modern projection flows.

Primary editable fields:

```text
modern.base_mwh
modern.peak_mwh
```

Conversion from modern UI values to canonical rows:

```text
modern_base_mw = modern.base_mwh / H
modern_peak_mw = modern.peak_mwh / Hp
allocation_peak_mw = modern_base_mw + modern_peak_mw
canonical_base_mw = (modern.base_mwh + modern.peak_mwh) / H
canonical_peak_mw = allocation_peak_mw - canonical_base_mw
```

Rows written:

```text
allocation.peak.sys.mw  = allocation_peak_mw
allocation.peak.epad.mw = allocation_peak_mw
base.sys.mw             = canonical_base_mw
base.epad.mw            = canonical_base_mw
peak.sys.mw             = canonical_peak_mw
peak.epad.mw            = canonical_peak_mw
```

Negative modern.peak_mwh is allowed.

Negative modern.base_mwh is rejected.

No persisted transaction should use `modern.*` as source-of-truth component codes.

## Classic forecast and hedge forecast flow

Peaks.Classic Forecast and Hedge Forecast should be customer-facing Classic projection flows.

Primary editable fields:

```text
classic.offpeak_mwh
classic.peak_mwh
```

Customer labels:

```text
Offpeak MWh
Peak MWh
```

Conversion from Classic UI values to canonical rows:

```text
classic_offpeak_mw = classic.offpeak_mwh / Ho
classic_peak_mw = classic.peak_mwh / Hp
total_mwh = classic.offpeak_mwh + classic.peak_mwh
canonical_base_mw = total_mwh / H
allocation_peak_mw = classic_peak_mw
canonical_peak_mw = allocation_peak_mw - canonical_base_mw
```

Rows written:

```text
allocation.peak.sys.mw  = allocation_peak_mw
allocation.peak.epad.mw = allocation_peak_mw
base.sys.mw             = canonical_base_mw
base.epad.mw            = canonical_base_mw
peak.sys.mw             = canonical_peak_mw
peak.epad.mw            = canonical_peak_mw
```

Customer-entered Offpeak/Peak MWh should not be negative. Canonical peak may become negative when customer is peak-light vs flat base.

No persisted transaction should use `classic.*` as source-of-truth component codes.

## Feature/perspective UI structure

There should be one main demo portfolio in the UI.

Global portfolio selector is removed or demoted.

Global perspective selector is removed or demoted.

Perspective switching happens inside each feature.

Main feature list uses generic names, e.g.:

```text
Portfolio Details
Forecast
Hedge Forecast
Calloff List
Position Report
Position
Data Viewer
Hedge Baseload
```

Feature perspective rules:

```text
Forecast: Baseloads | Classic | Modern
Hedge Forecast: Classic | Modern
Calloff List: Baseloads | Classic | Modern
Position Report: Baseloads | Classic | Modern
Position: Baseloads | Classic | Modern
Data Viewer: Canonical | Baseloads | Classic | Modern
Hedge Baseload: no perspective selector yet
```

Switching perspective inside a feature must not change selected portfolio or dataset.

The UI should explain that the same canonical portfolio is shown through different perspectives.

## Package history from this session

Important packages created/updated in this session:

- `P0024-correct-peaks-modern-premium-volume.md`
  - Corrected PeaksModern peak transaction volume from full peak consumption to premium/shape volume above flat base.

- `P0025-canonical-product-model-realignment.md`
  - Established Portfolio Hedging Products, product packages, canonical model, categories, projection listener rules.

- `P0026-peaks-classic-legacy-calloff-list.md`
  - Added Classic/Legacy Peak-Offpeak calloff list logic.

- `P0027-rename-peak-premium-to-peak.md`
  - Renamed `peak.premium.*` target to neutral `peak.*`.

- `P0028-split-allocation-peak-into-sys-epad.md`
  - Split `allocation.peak` into `allocation.peak.sys` and `allocation.peak.epad`.

- `P0029-peaks-modern-calloff-transaction-list.md`
  - Updated to require both Classic and Modern projected calloff transaction lists and value-preserving prices.

- `P0030-calloff-lists-use-mwh-columns.md`
  - Corrected customer calloff lists to display MWh columns, not MW columns.

- `P0032-modern-projected-transaction-model.md`
  - Formalized `Modern Projected Transactions` and `Modern Projected Calloffs` using `modern.*` projected component names.

- `P0033-peaks-modern-forecast-and-hedge-flow-use-modern-projection.md`
  - Changed Peaks.Modern Forecast/Hedge Forecast to use modern.base/modern.peak MWh in UI while persisting canonical rows.

- `P0034-universal-model-perspective-features.md`
  - Defined tool feature matrix for Baseloads/Classic/Modern perspectives.

- `P0035-single-portfolio-feature-perspective-tabs.md`
  - Corrected UI structure: single demo portfolio and perspective switching inside features.

- `P0036-peaks-classic-forecast-and-hedge-forecast.md`
  - Added Classic Forecast and Hedge Forecast using Offpeak/Peak MWh while persisting canonical rows.

Note: P0031 was ordered directly to Codex outside this chat and reportedly created initial Data Viewer views for Modern calloffs/transactions, but the result was not aligned with the desired model. P0032 supersedes/corrects it.

## PoC database reset stance

During current PoC development, it is acceptable that database rebuilds reset the database.

Do not spend effort on production migration yet.

Seed/reference data should be updated to reflect the current canonical model.

## What not to store in repo

Do not store:

- real company or internal program names,
- real customers or portfolios,
- actual prices, actual trading positions, actual volumes,
- confidential business cases,
- private strategy or internal governance details.

Use generic synthetic examples only.

## Current next-step likely direction

After P0036, likely next packages may include:

- clean up feature UI after P0035/P0036 implementation,
- align Data Viewer to clearly separate raw canonical and projected views,
- implement Baseloads perspective details,
- implement Position/Position Report perspective selectors,
- fix any regressions from overlapping packages P0029-P0036.
