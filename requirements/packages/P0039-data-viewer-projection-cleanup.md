# P0039 - Data Viewer projection cleanup

## Purpose

Clean up the Data Viewer so it clearly separates raw canonical data, customer-facing projected views, and market/internal views.

The goal is to make the PoC easier to understand after P0037 and P0038 by showing that the same underlying canonical portfolio can be inspected through several explicitly named views without mixing source-of-truth rows and projected/fictive rows.

This is a view-structure and clarity package. It should not redesign the hedging model.

## Background

P0037 created a canonical component catalog and distinguished:

1. canonical source-of-truth components,
2. Modern projected components,
3. Classic projected components,
4. deprecated aliases.

P0038 added runtime classification and guardrails so projected-only component names such as `modern.*` and `classic.*` cannot be persisted as source-of-truth product/q-factor component metadata.

The Data Viewer should now use this separation directly. It should be a transparency tool that helps users inspect the model without creating confusion about which rows are raw canonical data and which rows are projected output rows.

## Safety boundary

Keep all work public-safe and generic.

Do not add real customer names, company names, internal product names, system names, prices, forecasts, contract terms or copied internal documents.

Use only synthetic examples and neutral terms.

## Conceptual target

The Data Viewer should present three clearly separated worlds:

```text
1. Raw canonical
   Stored source-of-truth rows and model inputs.

2. Projected customer views
   Derived Classic, Modern and Baseloads customer-facing perspectives.

3. Market/internal views
   Derived market/trading/internal analytical views.
```

The same selected portfolio/dataset should be used across all views. Switching Data Viewer view type must not change selected portfolio or source data.

## Required inspection

Review at least:

```text
src/hedging/dataViewer.ts
src/hedging/HedgingToolView.ts
src/hedging/features.ts
src/hedging/modernProjection.ts
src/hedging/classicProjection.ts
src/hedging/marketProjection.ts
src/hedging/peaksCalloffTransactionList.ts
src/hedging/positionReport.ts
src/database/canonicalComponents.ts
src/database/repository.ts
src/database/pocSeedData.ts
tests/hedging/dataViewer.test.ts
tests/hedging/hedgingTool.test.ts
tests/hedging/peaksCalloffTransactionList.test.ts
```

Do not assume every listed file must change. Inspect first and change only where useful.

## Required Data Viewer structure

### 1. View groups

The Data Viewer should expose explicit view groups. Exact naming may follow current UI conventions, but the model distinction must be visible.

Minimum groups:

```text
Raw canonical
Projected customer views
Market/internal views
```

Acceptable detailed view names include:

```text
Raw Canonical Components
Raw Product Configuration
Raw Calloff Transactions
Projected Modern Transactions
Projected Modern Calloffs
Projected Classic Transactions / Calloffs
Projected Baseloads Calloffs
Market Projection
Internal Component View
```

Use only views that exist or can be produced with small helper functions. Do not invent large new data models in this package.

### 2. Raw canonical views

Raw canonical views must show source-of-truth rows only.

They may show canonical component codes such as:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

They must not present projected-only names such as `modern.*` or `classic.*` as if they were persisted source-of-truth rows.

If compatibility aliases or reserved component codes appear in raw rows, the Data Viewer should make that status visible if practical, for example through a `component_concept` or similar column.

### 3. Projected customer views

Projected customer views may show projected names and customer-facing labels.

Modern projected rows may use:

```text
modern.base.sys
modern.base.epad
modern.peak.sys
modern.peak.epad
```

Classic projected rows may use:

```text
classic.offpeak.sys
classic.offpeak.epad
classic.peak.sys
classic.peak.epad
```

Customer-facing calloff lists should continue to display MWh, not MW, where that is already the established model.

Projected views must clearly indicate that the rows are derived from canonical data.

### 4. Market/internal views

Market/internal views should use the existing market projection semantics:

```text
include base, peak, profile
exclude allocation
```

The Data Viewer must not double-count sys and epad as physical volume.

If a market/internal view shows both sys and epad dimensions, the output should make clear that they are price dimensions, not additive physical volumes.

### 5. Component concept visibility

Where useful, add a simple `component_concept` or equivalent field to Data Viewer outputs using the P0038 classification:

```text
canonical
projected
compatibility_alias
reserved
unknown_adjustment
```

This is especially useful for raw/internal inspection views.

Do not clutter customer-facing calloff lists if the field makes those views less readable.

### 6. Explain the view separation in UI text

Add short explanatory copy in the Data Viewer output/shell if the current structure supports it.

The explanation should state, in neutral language, that:

```text
The Data Viewer shows the same underlying portfolio through raw canonical rows and derived projected views. Projected rows are view/output rows, not persisted source-of-truth transactions.
```

Keep the text short.

## Required tests / validation

Add or update tests to validate at least:

1. Data Viewer exposes or returns distinguishable raw canonical and projected view groups.
2. Raw canonical views do not emit `modern.*` or `classic.*` projected-only component names as source-of-truth rows.
3. Modern projected views may emit `modern.*` names and mark them as projected or otherwise keep them clearly in projected views.
4. Classic projected views may emit `classic.*` names if implemented; otherwise the test should validate explicit absence/unsupported state without silent mixing.
5. Market/internal views still exclude allocation components.
6. Data Viewer does not sum sys and epad as physical customer volume.
7. Existing P0037 component catalog tests and P0038 component-code tests still pass.
8. The same portfolio/dataset remains selected when switching Data Viewer view type, if this state is represented in code.

Use small focused tests. Do not add brittle snapshot tests for large HTML output unless that is already the established pattern.

## Documentation updates

Update or add concise documentation in:

```text
docs/hedging/data_viewer.md
```

Cross-link to:

```text
docs/hedging/component_catalog.md
docs/hedging/modern_projected_transactions.md
docs/hedging/modern_projected_calloffs.md
docs/hedging/classic_projection_peak_offpeak_rules.md
docs/hedging/component_categories_and_projection_listeners.md
```

Update other docs only if needed. Do not duplicate the component catalog.

## Non-goals

Do not redesign canonical component formulas, Classic/Modern projection formulas, forecast or hedge forecast flows, financial settlement, price API, purchase flow or database migration strategy.

Do not change P0038 guardrail behavior.

Do not persist `modern.*` or `classic.*` component names as canonical source-of-truth rows.

Do not turn Data Viewer into a full reporting module. It remains a PoC transparency and inspection feature.

## Expected result

After this package:

- Data Viewer should be easier to explain to a user,
- raw canonical rows should be visibly distinct from projected rows,
- projected Modern/Classic rows should be clearly view-only,
- market/internal views should not include allocation helper rows as market exposure,
- sys/epad double-counting risk should be reduced,
- tests should catch accidental mixing of raw and projected component names.

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

If tracked files are added, removed or moved, update `REPOSITORY_FILES.md` to match `git ls-files`.

## Completion report

Report files inspected, files changed, Data Viewer view groups created/changed, raw canonical view behavior, projected view behavior, market/internal view behavior, component concept visibility, tests, `npm test`, `git diff --check` and `REPOSITORY_FILES.md` status.
