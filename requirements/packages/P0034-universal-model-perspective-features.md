# P0034 - Universal model perspective features

## Purpose

Rework the PoC tool so it demonstrates the real purpose of the canonical model:

```text
The same customer/portfolio/calloff data can be viewed through several product perspectives.
```

The tool should show that the canonical model is universal and supports:

- historical model compatibility,
- future model compatibility,
- customer/product movement without database administration,
- multiple customer-facing product packages over the same underlying data.

This is a controlled feature-structure package.

## Core principle

Do not treat `Baseloads`, `Classic` and `Modern` as separate isolated data sets.

The same selected customer/portfolio must be usable across perspectives.

The same canonical rows must be projected into different feature perspectives.

```text
Canonical model = source of truth
Perspective = how the same data is shown/used
Feature = workflow/report available in the tool
```

## Two levels of perspective switching

The tool should support the same data being viewed from multiple perspectives at two levels.

### Level 1: feature variants

Some features exist as perspective-specific feature variants.

For example:

```text
Forecast - Baseloads
Forecast - Classic
Forecast - Modern
```

or equivalent UI grouping.

### Level 2: perspective selector inside the same feature

Some features should also allow the same feature to be viewed from different perspectives using a selector/tabs/dropdown.

For example:

```text
Feature: Position Report
Perspective: Baseloads | Classic | Modern
```

This package should implement the minimal structure needed to demonstrate both levels without overbuilding the UI.

## Required perspectives

Implement these perspectives:

```text
Baseloads
Classic
Modern
```

Definitions:

### Baseloads perspective

Shows the position as a simple base/load product.

Primary concepts:

```text
Base
```

### Classic perspective

Shows the position as Peak/Offpeak.

Primary concepts:

```text
Offpeak
Peak
```

### Modern perspective

Shows the position as modern.base / modern.peak.

Primary concepts:

```text
modern.base
modern.peak
```

## Feature matrix

Convert the existing feature structure to this matrix.

### Forecast

Must be available in three perspective variants:

```text
Forecast - Baseloads
Forecast - Classic
Forecast - Modern
```

Expected behavior:

- Baseloads: show/edit base/total forecast perspective.
- Classic: show/edit Peak/Offpeak forecast perspective.
- Modern: show/edit modern.base/modern.peak forecast perspective.

All variants must read/write through the canonical model or the canonical forecast-to-canonical conversion logic.

Do not persist separate raw forecast tables per perspective unless already unavoidable in the PoC. If such tables exist, document them as derived/compatibility.

### Calloff List

Must be available in three perspective variants:

```text
Calloff List - Baseloads
Calloff List - Classic
Calloff List - Modern
```

Expected behavior:

- Baseloads: show base-only calloffs.
- Classic: show Peak/Offpeak calloffs, using the Classic projection from P0029/P0030.
- Modern: show Base/Peak calloffs, using the Modern projection from P0029/P0030.

Customer-facing calloff list volumes should use MWh columns per P0030.

### Position Report

Must support three perspectives:

```text
Position Report - Baseloads
Position Report - Classic
Position Report - Modern
```

or one Position Report feature with a perspective selector:

```text
Perspective = Baseloads | Classic | Modern
```

Expected behavior:

- Baseloads: base-only position.
- Classic: Peak/Offpeak position.
- Modern: modern.base/modern.peak position.

Use the same selected portfolio and underlying canonical data.

### Data Viewer

Must support three perspectives:

```text
Data Viewer - Baseloads
Data Viewer - Classic
Data Viewer - Modern
```

or one Data Viewer feature with perspective selector:

```text
Perspective = Canonical | Baseloads | Classic | Modern
```

The Data Viewer should make it obvious whether a table is raw canonical data or projected data.

Recommended views:

```text
Canonical Raw Transactions
Baseloads Projected Transactions
Classic Projected Transactions
Modern Projected Transactions
```

Modern projected transactions should follow P0032 and use:

```text
modern.base.sys
modern.base.epad
modern.peak.sys
modern.peak.epad
```

Classic projected transactions may use names such as:

```text
classic.offpeak.sys
classic.offpeak.epad
classic.peak.sys
classic.peak.epad
```

if implemented. If not implemented yet, Data Viewer may initially show Classic projected calloff rows only, but document the limitation.

### Position

`Position` must support three perspectives:

```text
Position - Baseloads
Position - Classic
Position - Modern
```

This can be implemented as one feature with perspective selector.

Expected behavior:

- Baseloads: base position.
- Classic: Peak/Offpeak position.
- Modern: modern.base/modern.peak position.

### Hedge Forecast

Must support two perspective variants:

```text
Hedge Forecast - Classic
Hedge Forecast - Modern
```

Expected behavior:

- Classic: user works in Peak/Offpeak terms.
- Modern: user works in modern.base/modern.peak terms per P0033.

Both must write canonical rows.

Do not persist perspective-specific hedge transactions as source of truth.

### Hedge Baseload

Keep one variant for now:

```text
Hedge Baseload
```

No perspective selector is required yet.

It should continue to write canonical base rows.

## UI navigation requirements

The UI should make the universal model story clear.

Recommended structure:

```text
Portfolio selector
Perspective selector: Baseloads | Classic | Modern
Feature list changes or filters according to perspective
```

Alternative acceptable structure:

```text
Feature list grouped by feature, with perspective tabs inside each feature
```

Minimum acceptable PoC structure:

```text
Same selected portfolio/customer stays active.
Features clearly indicate perspective in title or selector.
Switching perspective does not switch customer/portfolio or reset data.
```

## Same customer/portfolio requirement

The same selected customer/portfolio must be used for all perspectives.

Do not create separate portfolios just to demonstrate Baseloads, Classic and Modern.

If current seed data has separate example portfolios for old product names, this package should either:

1. consolidate to one demonstration portfolio with all perspective features enabled, or
2. introduce a shared demo portfolio and mark older portfolios as compatibility/demo-only.

The intended demonstration is:

```text
Same portfolio
same canonical rows
multiple perspectives
```

## Product package vs perspective

The tool may still keep product package metadata:

```text
Baseloads
Peaks.Classic
Peaks.Modern
Profiles.Classic
Profiles.Modern
```

But for this PoC, the goal is not to hard-lock a portfolio to one visible package.

The goal is to demonstrate that the same canonical data can support multiple product perspectives.

Therefore, a demo portfolio may expose multiple perspectives even if a real customer contract would normally expose only one product package.

Add a clear comment/doc note:

```text
For demo purposes, perspectives can be shown side-by-side for the same portfolio to prove model compatibility.
In production, product package/contract would determine which perspective/features are customer-visible.
```

## Canonical source of truth

All perspective features must read from or write to the canonical model.

Canonical Peaks rows:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

Projected rows/views are not source of truth.

Do not save `modern.*` or `classic.*` rows as raw transaction rows unless explicitly materialized as derived view data. If materialized, mark them derived and rebuildable.

## Perspective conversion expectations

Use formulas from P0029-P0033.

### Classic projection

Classic shows Offpeak/Peak.

```text
ClassicPeakMWh = allocation_peak_mw * peak_h
ClassicOffpeakMWh = canonical_base_mw * total_h - ClassicPeakMWh
```

Prices must preserve canonical value per P0029/P0030.

### Modern projection

Modern shows modern.base/modern.peak.

Use P0033 conversion rules for forecast/hedge entry and P0032/P0030 projection rules for display.

Customer-facing calloff list uses MWh:

```text
ModernBaseMWh
ModernPeakMWh
ModernBasePrice
ModernPeakPrice
```

### Baseloads projection

Baseloads shows total/base only.

For a Peaks-capable canonical position, Baseloads perspective may show only the base portion and optionally warn that peak/profile components exist but are hidden by this perspective.

Do not destroy or ignore canonical peak rows internally.

## Documentation

Create or update:

```text
docs/hedging/universal_model_demo_tool.md
docs/hedging/perspective_feature_matrix.md
docs/hedging/perspectives_and_product_packages.md
```

Document:

- purpose of the tool is to prove canonical model universality,
- same portfolio can be viewed through Baseloads, Classic and Modern perspectives,
- feature variants vs perspective selector inside a feature,
- production product package visibility may differ from demo visibility,
- perspective views are projections, not source-of-truth data,
- Forecast, Calloff List, Position Report, Data Viewer and Position have Baseloads/Classic/Modern variants,
- Hedge Forecast has Classic/Modern variants,
- Hedge Baseload remains one variant.

## Tests

Add or update tests for:

1. same selected portfolio can show Baseloads, Classic and Modern perspectives,
2. changing perspective does not change selected portfolio,
3. Forecast has Baseloads, Classic and Modern perspective variants,
4. Calloff List has Baseloads, Classic and Modern perspective variants,
5. Position Report has Baseloads, Classic and Modern perspective variants or one perspective selector,
6. Data Viewer has Baseloads, Classic and Modern projected views plus canonical/raw view if available,
7. Position has Baseloads, Classic and Modern variants or one perspective selector,
8. Hedge Forecast has Classic and Modern variants,
9. Hedge Baseload remains single variant,
10. Modern Forecast uses modern.base/modern.peak terms and writes canonical rows,
11. Classic Calloff List uses Peak/Offpeak projection,
12. Modern Calloff List uses Base/Peak projection,
13. Modern Projected Transactions use `modern.*` names and are not raw canonical transactions,
14. raw canonical Data Viewer still shows canonical rows,
15. switching between perspectives preserves value-equivalence for the same calloff where applicable,
16. no perspective-specific projected rows become source-of-truth transactions.

## Non-goals

Do not implement:

- full production contract visibility/entitlement logic,
- product migration UI,
- settlement redesign,
- Profiles full projections unless already simple to expose,
- market projection changes.

This package is about tool structure and perspective-based demonstration.

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
- UI/navigation structure chosen,
- feature matrix implemented,
- whether same portfolio shows all perspectives,
- how old product-specific portfolios were handled,
- Forecast variants,
- Calloff List variants,
- Position Report variants,
- Data Viewer variants,
- Position variants,
- Hedge Forecast variants,
- Hedge Baseload behavior,
- tests run and result,
- `REPOSITORY_FILES.md` status.
