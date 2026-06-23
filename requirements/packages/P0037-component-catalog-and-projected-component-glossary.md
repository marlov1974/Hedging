# P0037 - Component catalog and projected component glossary

## Purpose

Create a single durable component catalog for the PoC.

The goal is to remove ambiguity between:

1. canonical source-of-truth components,
2. projected / fictive components used only in Classic or Modern projections,
3. deprecated aliases retained only for compatibility.

This is primarily a documentation/consolidation package. Make only small code/test changes if needed to align terminology.

## Background

The model now has several layers:

```text
Canonical model = stored database/source-of-truth components
Classic projection = customer-facing Peak/Offpeak perspective
Modern projection = customer-facing Base/Peak perspective and modern-only projected model
Market projection = market/trading/internal hedge view
Raw/internal view = unfiltered canonical data
```

Several packages introduced or renamed components:

- P0025 established canonical model and component categories.
- P0027 renamed `peak.premium.*` to `peak.*`.
- P0028 split `allocation.peak` into `allocation.peak.sys` and `allocation.peak.epad`.
- P0032 introduced projected `modern.*` component names.
- P0036 introduced Classic forecast/hedge concepts in Offpeak/Peak terms.

The terminology is correct but spread across many packages. This package consolidates it.

## Required documentation file

Create:

```text
docs/hedging/component_catalog.md
```

This file must become the canonical glossary for components and component-like projection names.

## Required structure of component_catalog.md

The file must contain these sections:

```text
1. Purpose
2. Layer overview
3. Canonical source-of-truth components
4. Modern projected components
5. Classic projected components
6. Deprecated aliases
7. Visibility/projection listeners
8. Physical volume and double-counting rules
9. Formula summary
10. Examples
```

## 1. Purpose

Explain that the catalog distinguishes between actual stored components and projected component names.

State clearly:

```text
Only canonical components are source-of-truth transaction component codes.
Projected components exist only in feature projections/views.
```

## 2. Layer overview

Document the layers:

```text
Canonical components
  Stored in database. Source of truth.

Modern projected components
  Derived from canonical model. Used to demonstrate a modern-only optimized model.

Classic projected components
  Derived from canonical model. Used to present Peak/Offpeak customer views.

Deprecated aliases
  Read-only compatibility names for old fixtures/code during migration.
```

## 3. Canonical source-of-truth components

Document at least the current Peaks canonical component set:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

For each component, document:

- component code,
- component category,
- whether it is persisted source of truth,
- stored unit,
- hour basis,
- price behavior,
- q-factor behavior,
- customer projection behavior,
- market projection behavior,
- internal/raw behavior,
- meaning.

### Canonical component definitions

Use this content.

#### allocation.peak.sys

```text
category = allocation
persisted = yes
stored unit = MW
hour basis = peak_h
price = 0
q_factor = 0
customer projection = included as input, not displayed directly unless a feature explicitly asks for raw/internal data
market projection = excluded
internal/raw = included
meaning = customer's actual peak-hour MW for the system dimension; helper/allocation component
```

#### allocation.peak.epad

```text
category = allocation
persisted = yes
stored unit = MW
hour basis = peak_h
price = 0
q_factor = 0
customer projection = included as input, not displayed directly unless a feature explicitly asks for raw/internal data
market projection = excluded
internal/raw = included
meaning = customer's actual peak-hour MW for the EPAD/area dimension; helper/allocation component
```

#### base.sys

```text
category = base
persisted = yes
stored unit = MW
hour basis = total_h
price = priced
q_factor = relevant
customer projection = included
market projection = included
internal/raw = included
meaning = flat monthly system-price base exposure over the whole month
```

#### base.epad

```text
category = base
persisted = yes
stored unit = MW
hour basis = total_h
price = priced
q_factor = relevant
customer projection = included
market projection = included
internal/raw = included
meaning = flat monthly EPAD/area base exposure over the whole month
```

#### peak.sys

```text
category = peak
persisted = yes
stored unit = MW
hour basis = peak_h
price = priced
q_factor = relevant
customer projection = included
market projection = included
internal/raw = included
meaning = canonical system-price peak component relative to flat monthly base
```

#### peak.epad

```text
category = peak
persisted = yes
stored unit = MW
hour basis = peak_h
price = priced
q_factor = relevant
customer projection = included
market projection = included
internal/raw = included
meaning = canonical EPAD/area peak component relative to flat monthly base
```

### Broader reserved canonical components

Also document these as broader/reserved components where applicable:

```text
profile.sys
profile.epad
volume
currency.sek
adjustment.*
```

State that their detailed semantics may be implemented in later packages, but categories are reserved.

## 4. Modern projected components

Document that these are projected/fictive component names.

They are not persisted as source-of-truth transaction component codes.

Required component names:

```text
modern.base.sys
modern.base.epad
modern.peak.sys
modern.peak.epad
```

For each, document:

#### modern.base.sys

```text
persisted = no, projected only
source = canonical model
meaning = modern base layer in system dimension; offpeak level applied as base layer over the whole month
```

#### modern.base.epad

```text
persisted = no, projected only
source = canonical model
meaning = modern base layer in EPAD/area dimension; offpeak level applied as base layer over the whole month
```

#### modern.peak.sys

```text
persisted = no, projected only
source = canonical model
meaning = modern peak layer in system dimension; extra peak effect above modern.base during peak hours
```

#### modern.peak.epad

```text
persisted = no, projected only
source = canonical model
meaning = modern peak layer in EPAD/area dimension; extra peak effect above modern.base during peak hours
```

Document that projected `modern.*` component names are used in:

```text
Modern Projected Transactions
Modern Projected Calloffs
Modern Feature Set / Base-Peak views
```

## 5. Classic projected components

Document projected/fictive Classic components even if not fully implemented yet.

Recommended names:

```text
classic.offpeak.sys
classic.offpeak.epad
classic.peak.sys
classic.peak.epad
```

They are not persisted as source-of-truth transaction component codes.

Definitions:

#### classic.offpeak.sys

```text
persisted = no, projected only
source = canonical model
meaning = Classic Offpeak position in system dimension
```

#### classic.offpeak.epad

```text
persisted = no, projected only
source = canonical model
meaning = Classic Offpeak position in EPAD/area dimension
```

#### classic.peak.sys

```text
persisted = no, projected only
source = canonical model
meaning = Classic Peak position in system dimension; full peak level
```

#### classic.peak.epad

```text
persisted = no, projected only
source = canonical model
meaning = Classic Peak position in EPAD/area dimension; full peak level
```

Classic means Peak/Offpeak levels.

Modern means Base/Peak layers.

## 6. Deprecated aliases

Document these aliases as temporary compatibility only:

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

## 7. Visibility/projection listeners

Document default inclusion by category:

```text
Customer projections:
include allocation, base, peak, profile, volume, currency
exclude adjustment/internal-only components

Market projection:
include base, peak, profile
exclude allocation

Internal/raw:
include all components
```

Clarify that component category drives default projection inclusion.

`q_factor` is not the same as visibility.

`q_factor` controls market quantity transformation.

Visibility controls which projections include the component.

## 8. Physical volume and double-counting rules

Must document:

- `base.sys` and `base.epad` are two price dimensions on the same physical base volume.
- `peak.sys` and `peak.epad` are two price dimensions on the same physical peak component volume.
- `allocation.peak.sys` and `allocation.peak.epad` are two helper dimensions for the same peak-hour level.
- Never sum sys and epad as physical customer volume.
- Use one effective volume carrier, usually sys, and warn if sys/epad differ beyond tolerance.

## 9. Formula summary

Include the main formulas.

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

Include at least one positive example:

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

Include at least one negative peak example:

```text
forecast_mwh = 100
hedge_pct = 1.0
peak_pct = 0.35
total_h = 744
peak_h = 320
```

Expected:

```text
allocation_peak_mw = 0.109375
peak_mw = -0.0250336022
```

Document that negative canonical peak is valid.

## Update other docs

Update or cross-link from existing docs where appropriate:

```text
docs/hedging/canonical_component_model.md
docs/hedging/component_categories_and_projection_listeners.md
docs/hedging/modern_projected_model.md
docs/hedging/peaks_classic_forecast_feature.md
docs/hedging/peaks_modern_forecast_feature.md
```

If some files do not exist, do not fail the package. Create the catalog and add links only to files that exist.

## Update README or memory pointers

Update `README.md` or the memory summary only if useful, to point readers to:

```text
docs/hedging/component_catalog.md
```

Do not duplicate the whole catalog in README.

## Tests / validation

This is primarily documentation, but add/update lightweight tests if the repo has doc or vocabulary tests.

Validate at least:

1. component catalog exists,
2. catalog mentions all canonical Peaks components,
3. catalog mentions all modern projected components,
4. catalog mentions all classic projected components,
5. catalog marks projected components as not source-of-truth,
6. catalog lists deprecated aliases,
7. catalog states sys/epad must not be summed as physical volume.

If no suitable test framework exists for docs, document manual validation in package run report.

## Non-goals

Do not change runtime behavior unless a tiny terminology alignment is required.

Do not redesign:

- canonical component model,
- forecast/hedge flows,
- market projection,
- Data Viewer,
- settlement.

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
- created component catalog path,
- canonical components documented,
- modern projected components documented,
- classic projected components documented,
- deprecated aliases documented,
- tests/manual validation,
- `REPOSITORY_FILES.md` status.
