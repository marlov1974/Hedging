# P0043 - Projected model report basis

## Purpose

Clarify and enforce the design principle that the canonical model is the source of truth, while Classic and Modern are explicit projected models. Data Viewer should show these projected models, and downstream reports/lists should be built on the projected models rather than recalculating directly from raw canonical rows when a corresponding projected model exists.

This package is a design alignment package after P0041/P0042 introduced the normalized currency/value-unit model.

## Core design decision

The model has three layers:

```text
1. Canonical model
   Source-of-truth component transactions.

2. Projected models
   Classic projected model.
   Modern projected model.

3. Reports and customer-facing views
   Calloff List.
   Position Report.
   Other feature/report outputs.
```

Rules:

```text
Canonical model -> Classic projected model -> Classic reports/views
Canonical model -> Modern projected model  -> Modern reports/views
```

Reports should not bypass the projected model and independently reinterpret raw canonical rows when the corresponding Classic or Modern projected model exists.

## Background

Earlier packages created a canonical component model and several projections/views:

- Classic projection / Peak-Offpeak perspective.
- Modern projection / Base-Peak perspective.
- Modern projected transactions and calloffs.
- Data Viewer raw and projected views.
- Position Report and Calloff List.
- Currency component model and normalized value/unit fields.

The current design should be sharpened so that Classic and Modern are not only UI perspectives. They are explicit projected models used as the basis for reports.

## Safety boundary

Keep all work public-safe and generic.

Do not add:

- real customer names,
- real company names,
- real internal product names,
- real system names,
- real prices,
- real forecasts,
- real contract terms,
- real FX rates,
- copied internal documents.

Use only synthetic examples and neutral terms.

## Required inspection

Review at least:

```text
docs/hedging/component_catalog.md
docs/hedging/data_viewer.md
docs/hedging/modern_projected_model.md
docs/hedging/modern_projected_transactions.md
docs/hedging/modern_projected_calloffs.md
docs/hedging/classic_projection_peak_offpeak_rules.md
docs/hedging/classic_projection_price_rules.md
docs/hedging/peaks_classic_calloff_transaction_list.md
docs/hedging/peaks_modern_calloff_transaction_list.md
docs/hedging/position_report.md
docs/hedging/currency_component_model.md
src/hedging/classicProjection.ts
src/hedging/modernProjection.ts
src/hedging/peaksCalloffTransactionList.ts
src/hedging/calloffList.ts
src/hedging/positionReport.ts
src/hedging/dataViewer.ts
src/hedging/financialSettlement.ts
src/hedging/marketProjection.ts
tests/hedging/classicProjection.test.ts
tests/hedging/dataViewer.test.ts
tests/hedging/peaksCalloffTransactionList.test.ts
tests/hedging/positionReport.test.ts
tests/hedging/financialSettlement.test.ts
```

Do not assume every listed file must change. Inspect first and change only where useful.

## 1. Define projected model contracts

Ensure there is a clear function/model contract for:

```text
Classic projected model
Modern projected model
```

Each projected model should be a deterministic projection from canonical rows.

Each projected model should include, where relevant:

```text
component_code / projected component code
period
quantity
quantity_type
price
price_type
factor
factor_type
derived MWh/value fields with explicit units
currency.eursek rows where applicable
warnings/status fields where applicable
```

The projected models may expose derived fields, but must retain enough normalized fields to support downstream reports without reinterpreting raw canonical rows.

## 2. Data Viewer should show canonical and projected models

Data Viewer should show at least these conceptual views:

```text
Canonical model
Classic projected model
Modern projected model
```

Rules:

- Canonical model view shows source-of-truth rows.
- Classic projected model view shows Classic projection rows.
- Modern projected model view shows Modern projection rows.
- Classic/Modern projected views should include `currency.eursek` rows when those rows belong to the same calloff/transaction group.
- Projected models must not persist projected component names as canonical source-of-truth rows.
- Data Viewer should make it clear which model/view is being shown.

## 3. Reports must use projected models

Classic reports should use the Classic projected model as input.

Modern reports should use the Modern projected model as input.

Reports include at least:

```text
Classic Calloff List
Modern Calloff List
Classic Position Report
Modern Position Report
```

Rules:

- Classic Calloff List must be built from Classic projected model output.
- Modern Calloff List must be built from Modern projected model output.
- Classic Position Report must be built from Classic projected model output.
- Modern Position Report must be built from Modern projected model output.
- Reports should not independently recalculate Classic/Modern quantities from raw canonical rows if the projected model already provides them.
- If a needed field is missing from the projected model, extend the projected model rather than adding one-off logic only in the report.

## 4. Currency conversion belongs in projected/report layer based on projected model rows

For SEK portfolios, Classic/Modern reports should convert or report SEK values based on `currency.eursek` rows included in the corresponding projected model.

Rules:

- Use `currency.eursek` from the projected model/report input, not a hidden global settlement quote.
- Keep partial FX coverage visible.
- Do not treat currency rows as MWh or MW.
- Do not treat currency rows as power exposure.
- If the projected model lacks a currency row but the portfolio requires SEK reporting, report a warning/status instead of silently converting.

## 5. Avoid duplicate transformation logic

The same conceptual transformation should not exist separately in many reports.

Preferred structure:

```text
canonical rows
  -> projectClassicModel(...)
      -> buildClassicCalloffList(...)
      -> buildClassicPositionReport(...)

canonical rows
  -> projectModernModel(...)
      -> buildModernCalloffList(...)
      -> buildModernPositionReport(...)
```

If current code names differ, align behavior and document the actual function names in the P0043 completion report.

## 6. Documentation updates

Update documentation to make this architecture explicit, likely in:

```text
docs/hedging/data_viewer.md
docs/hedging/modern_projected_model.md
docs/hedging/classic_projection_peak_offpeak_rules.md
docs/hedging/peaks_classic_calloff_transaction_list.md
docs/hedging/peaks_modern_calloff_transaction_list.md
docs/hedging/position_report.md
docs/hedging/currency_component_model.md
```

Do not duplicate large formulas unnecessarily. Cross-link existing formula docs where possible.

## Required tests / validation

Add or update tests to validate at least:

1. Data Viewer exposes Canonical, Classic projected and Modern projected model views.
2. Classic projected model includes all fields required by Classic Calloff List and Classic Position Report.
3. Modern projected model includes all fields required by Modern Calloff List and Modern Position Report.
4. Classic Calloff List uses Classic projected model output rather than independently recalculating from raw canonical rows.
5. Modern Calloff List uses Modern projected model output rather than independently recalculating from raw canonical rows.
6. Classic Position Report uses Classic projected model output.
7. Modern Position Report uses Modern projected model output.
8. `currency.eursek` rows appear in Classic/Modern projected models where relevant.
9. SEK reporting uses currency rows from the projected model/report input.
10. Currency rows are not treated as MWh/MW or power exposure.
11. Existing P0037-P0042 tests still pass.

Because it can be hard to test internal architecture directly, acceptable tests may use helper seams, spies, or structured function inputs that prove reports consume projected model rows.

## Non-goals

Do not redesign canonical formulas.

Do not remove the canonical model.

Do not persist projected component names as source-of-truth transactions.

Do not implement real FX sourcing or real market settlement logic.

Do not introduce real market data.

## Expected result

After this package:

- the canonical model remains source of truth,
- Classic and Modern are explicit projected models,
- Data Viewer shows canonical, Classic projected and Modern projected views,
- reports are built from the relevant projected model,
- SEK/currency reporting uses currency rows carried through the projected model,
- duplicated projection/report transformation logic is reduced.

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

If tracked files are added, removed or moved, update `REPOSITORY_FILES.md` to match `git ls-files`.

## Completion report

Report:

- files inspected,
- files changed,
- projected model contracts created/changed,
- Data Viewer model views,
- report input basis for Classic,
- report input basis for Modern,
- currency row handling in projected models,
- SEK reporting behavior,
- tests added/updated,
- `npm test` result,
- `git diff --check` result,
- `REPOSITORY_FILES.md` status.
