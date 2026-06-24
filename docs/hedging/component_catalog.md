# Component Catalog

## 1. Purpose

This catalog is the canonical glossary for component codes and component-like projected names in the PoC.

It distinguishes:

- canonical source-of-truth components,
- projected component names used only in feature projections and views,
- deprecated aliases retained only for compatibility.

Only canonical components are source-of-truth transaction component codes.

Projected components exist only in feature projections/views.

Runtime validation must reject projected component names where persisted source-of-truth product components or q-factor components are required.

## 2. Layer Overview

Canonical components:

```text
Stored in database. Source of truth.
```

Modern projected components:

```text
Derived from canonical model. Used to demonstrate a modern-only optimized model.
```

Classic projected components:

```text
Derived from canonical model. Used to present Peak/Offpeak customer views.
```

Deprecated aliases:

```text
Read-only compatibility names for old fixtures/code during migration.
```

## 3. Canonical Source-Of-Truth Components

Current Peaks canonical component set:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

### `allocation.peak.sys`

| Field | Value |
| --- | --- |
| component code | `allocation.peak.sys` |
| component category | `allocation` |
| persisted source of truth | yes |
| stored unit | MW |
| hour basis | `peak_h` |
| price behavior | `0` |
| q-factor behavior | `0` |
| customer projection behavior | included as input, not displayed directly unless a feature explicitly asks for raw/internal data |
| market projection behavior | excluded |
| internal/raw behavior | included |
| meaning | customer's actual peak-hour MW for the system dimension; helper/allocation component |

### `allocation.peak.epad`

| Field | Value |
| --- | --- |
| component code | `allocation.peak.epad` |
| component category | `allocation` |
| persisted source of truth | yes |
| stored unit | MW |
| hour basis | `peak_h` |
| price behavior | `0` |
| q-factor behavior | `0` |
| customer projection behavior | included as input, not displayed directly unless a feature explicitly asks for raw/internal data |
| market projection behavior | excluded |
| internal/raw behavior | included |
| meaning | customer's actual peak-hour MW for the EPAD/area dimension; helper/allocation component |

### `base.sys`

| Field | Value |
| --- | --- |
| component code | `base.sys` |
| component category | `base` |
| persisted source of truth | yes |
| stored unit | MW |
| hour basis | `total_h` |
| price behavior | priced |
| q-factor behavior | relevant |
| customer projection behavior | included |
| market projection behavior | included |
| internal/raw behavior | included |
| meaning | flat monthly system-price base exposure over the whole month |

### `base.epad`

| Field | Value |
| --- | --- |
| component code | `base.epad` |
| component category | `base` |
| persisted source of truth | yes |
| stored unit | MW |
| hour basis | `total_h` |
| price behavior | priced |
| q-factor behavior | relevant |
| customer projection behavior | included |
| market projection behavior | included |
| internal/raw behavior | included |
| meaning | flat monthly EPAD/area base exposure over the whole month |

### `peak.sys`

| Field | Value |
| --- | --- |
| component code | `peak.sys` |
| component category | `peak` |
| persisted source of truth | yes |
| stored unit | MW |
| hour basis | `peak_h` |
| price behavior | priced |
| q-factor behavior | relevant |
| customer projection behavior | included |
| market projection behavior | included |
| internal/raw behavior | included |
| meaning | canonical system-price peak component relative to flat monthly base |

### `peak.epad`

| Field | Value |
| --- | --- |
| component code | `peak.epad` |
| component category | `peak` |
| persisted source of truth | yes |
| stored unit | MW |
| hour basis | `peak_h` |
| price behavior | priced |
| q-factor behavior | relevant |
| customer projection behavior | included |
| market projection behavior | included |
| internal/raw behavior | included |
| meaning | canonical EPAD/area peak component relative to flat monthly base |

### Broader Reserved Canonical Components

These categories and component names are reserved for the broader product family. Detailed semantics may be implemented in later packages.

| Component | Category | Status |
| --- | --- | --- |
| `profile.sys` | `profile` | reserved canonical profile component |
| `profile.epad` | `profile` | reserved canonical profile component |
| `volume` | `volume` | reserved volume component |
| `currency.sek` | `currency` | reserved currency component |
| `adjustment.*` | `adjustment` | reserved internal adjustment namespace |

## 4. Modern Projected Components

Modern projected component names are projected/fictive names.

They are not persisted as source-of-truth transaction component codes.

They are derived from the canonical model and are used in:

```text
Modern Projected Transactions
Modern Projected Calloffs
Modern Feature Set / Base-Peak views
```

### `modern.base.sys`

```text
persisted = no, projected only
source = canonical model
meaning = modern base layer in system dimension; offpeak level applied as base layer over the whole month
```

### `modern.base.epad`

```text
persisted = no, projected only
source = canonical model
meaning = modern base layer in EPAD/area dimension; offpeak level applied as base layer over the whole month
```

### `modern.peak.sys`

```text
persisted = no, projected only
source = canonical model
meaning = modern peak layer in system dimension; extra peak effect above modern.base during peak hours
```

### `modern.peak.epad`

```text
persisted = no, projected only
source = canonical model
meaning = modern peak layer in EPAD/area dimension; extra peak effect above modern.base during peak hours
```

## 5. Classic Projected Components

Classic projected component names are projected/fictive names.

They are not persisted as source-of-truth transaction component codes.

Classic means Peak/Offpeak levels.

Modern means Base/Peak layers.

### `classic.offpeak.sys`

```text
persisted = no, projected only
source = canonical model
meaning = Classic Offpeak position in system dimension
```

### `classic.offpeak.epad`

```text
persisted = no, projected only
source = canonical model
meaning = Classic Offpeak position in EPAD/area dimension
```

### `classic.peak.sys`

```text
persisted = no, projected only
source = canonical model
meaning = Classic Peak position in system dimension; full peak level
```

### `classic.peak.epad`

```text
persisted = no, projected only
source = canonical model
meaning = Classic Peak position in EPAD/area dimension; full peak level
```

## 6. Deprecated Aliases

These aliases are temporary compatibility only:

```text
allocation.peak -> allocation.peak.sys / allocation.peak.epad
peak.premium.sys -> peak.sys
peak.premium.epad -> peak.epad
peak.modern.sys -> peak.sys
peak.modern.epad -> peak.epad
PeaksModern -> Peaks.Modern
PeaksClassic -> Peaks.Classic
```

Rules:

- old rows may be read if fixtures remain,
- new rows must use target names,
- docs/tests should prefer target names,
- aliases are not a production migration strategy.

## 7. Visibility/Projection Listeners

Component category drives default projection inclusion.

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

Internal/raw:

```text
include all components
```

`q_factor` is not the same as visibility.

`q_factor` controls market quantity transformation.

Visibility controls which projections include the component.

Runtime code classifies component-like strings before persistence:

```text
canonical = current source-of-truth component code
projected = view/output-only component name
compatibility_alias = deprecated read-compatible name
reserved = known metadata outside the current Peaks source-of-truth set
unknown_adjustment = fallback for unknown or internal adjustment-like values
```

Only canonical, compatibility alias and reserved metadata entries may be persisted as product component metadata. Projected component names must remain view-only.

## 8. Physical Volume And Double-Counting Rules

`base.sys` and `base.epad` are two price dimensions on the same physical base volume.

`peak.sys` and `peak.epad` are two price dimensions on the same physical peak component volume.

`allocation.peak.sys` and `allocation.peak.epad` are two helper dimensions for the same peak-hour level.

Never sum sys and epad as physical customer volume.

Use one effective volume carrier, usually sys, and warn if sys/epad differ beyond tolerance.

Allocation rows are helper rows for customer projection input and raw/internal inspection. They must not be treated as additional physical customer volume.

## 9. Formula Summary

For each month:

```text
F = forecast_mwh
h = hedge_pct
p = peak_pct
H = total_h
Hp = peak_h
Ho = H - Hp
```

Canonical creation from forecast:

```text
base_mw = forecast_mwh * hedge_pct / total_h
allocation_peak_mw = forecast_mwh * hedge_pct * peak_pct / peak_h
peak_mw = allocation_peak_mw - base_mw
```

Canonical rows:

```text
allocation.peak.sys.mw  = allocation_peak_mw
allocation.peak.epad.mw = allocation_peak_mw
base.sys.mw             = base_mw
base.epad.mw            = base_mw
peak.sys.mw             = peak_mw
peak.epad.mw            = peak_mw
```

Projection MW values:

```text
B = effective canonical base MW
A = effective allocation peak MW

ClassicOffpeakMW = (B * H - A * Hp) / Ho
ClassicPeakMW = A
ModernBaseMW = ClassicOffpeakMW
ModernPeakMW = ClassicPeakMW - ModernBaseMW
```

Projected MWh:

```text
ClassicOffpeakMWh = ClassicOffpeakMW * Ho
ClassicPeakMWh = ClassicPeakMW * Hp
ModernBaseMWh = ModernBaseMW * H
ModernPeakMWh = ModernPeakMW * Hp
```

Canonical to Modern Projected Transactions per dimension:

```text
modern_base_sys_mw = (B_sys * H - A_sys * Hp) / Ho
modern_peak_sys_mw = A_sys - modern_base_sys_mw
modern_base_epad_mw = (B_epad * H - A_epad * Hp) / Ho
modern_peak_epad_mw = A_epad - modern_base_epad_mw
```

## 10. Examples

### Positive Peak Example

Input:

```text
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

Classic projection:

```text
ClassicOffpeakMW = (0.1344086022 * 744 - 0.15625 * 320) / 424 = 0.1179245283
ClassicPeakMW = 0.15625
ClassicOffpeakMWh = 50
ClassicPeakMWh = 50
```

Modern projection:

```text
ModernBaseMW = 0.1179245283
ModernPeakMW = 0.0383254717
ModernBaseMWh = 87.735849
ModernPeakMWh = 12.264151
```

### Negative Canonical Peak Example

Input:

```text
forecast_mwh = 100
hedge_pct = 1.0
peak_pct = 0.35
total_h = 744
peak_h = 320
```

Expected:

```text
base_mw = 100 / 744 = 0.1344086022
allocation_peak_mw = 100 * 0.35 / 320 = 0.109375
peak_mw = 0.109375 - 0.1344086022 = -0.0250336022
```

Negative canonical peak is valid.
