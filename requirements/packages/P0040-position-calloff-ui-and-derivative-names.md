# P0040 - Position, calloff UI and derivative naming fixes

## Purpose

Clean up duplicated position features, simplify the Position Report output, and add synthetic derivative names to Baseloads calloff rows using public market-style derivative terminology.

This package is driven by current mobile UI review findings:

1. `Position` and `Position Report` appear as separate features but are effectively the same feature.
2. Position output currently shows multiple component rows per month, which is too raw for the intended report view.
3. Baseloads calloff list currently has no calloff rows, but should show synthetic baseload derivative calloffs.
4. Calloff rows should include a synthetic derivative name rather than only generic component labels.

This is a UI/reporting cleanup package. It should not redesign the canonical component model.

## Background

The PoC now has one canonical portfolio with multiple feature perspectives:

```text
Baseloads
Classic
Modern
```

P0037 and P0038 clarified the distinction between canonical source-of-truth components, projected component names and compatibility aliases. P0039 is cleaning up Data Viewer separation. P0040 should clean up the user-facing Position/Calloff experience so it is less raw and easier to understand.

The Position Report should become an aggregated report, not a raw component dump.

The Calloff List should become a calloff-facing list, not an empty placeholder for Baseloads.

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
- copied internal documents.

Use only synthetic examples and neutral terms.

## Required inspection

Review at least:

```text
src/hedging/HedgingToolView.ts
src/hedging/features.ts
src/hedging/positionReport.ts
src/hedging/calloffList.ts
src/hedging/legacyCalloffList.ts
src/hedging/peaksCalloffTransactionList.ts
src/hedging/derivativeNames.ts
src/database/pocSeedData.ts
src/database/repository.ts
src/database/types.ts
tests/hedging/hedgingTool.test.ts
tests/hedging/positionReport.test.ts
tests/hedging/baseloadsCalloffList.test.ts
tests/hedging/legacyCalloffList.test.ts
tests/hedging/peaksCalloffTransactionList.test.ts
```

Do not assume every file must change. Inspect first and change only where useful.

## 1. Remove duplicate Position feature

The feature menu currently contains both:

```text
Position Report
Position
```

Remove `Position` as a separate feature.

Keep `Position Report` as the single position-related feature.

Rules:

- The UI/menu should only show `Position Report`.
- Existing route/state handling should not break if legacy code still references `Position`; if needed, map old `Position` selection to `Position Report` internally.
- Tests should verify that the rendered feature list does not contain a separate `Position` button/item.
- Do not remove source files aggressively if other code still imports them; prefer a safe compatibility redirect if necessary.

## 2. Simplify Position Report to one row per month

Position Report should show one aggregated row per month for the selected perspective.

It must not show one row per canonical component in the normal report view.

### Baseloads perspective columns

For Baseloads, show:

```text
month
base_sys_mwh
base_epad_mwh
base_sys_price
base_epad_price
```

Display labels may be more UI-friendly, for example:

```text
Month
Base SYS MWh
Base EPAD MWh
Base SYS Price
Base EPAD Price
```

Rules:

- One row per month.
- Do not include allocation rows.
- Do not include peak rows in Baseloads Position Report.
- `base_sys_mwh` and `base_epad_mwh` represent price dimensions over the same baseload physical volume; do not sum them as physical customer volume.

### Classic perspective columns

For Classic, show:

```text
month
offpeak_mwh
peak_epad_mwh
offpeak_price
peak_price
```

Display labels may be:

```text
Month
Offpeak MWh
Peak EPAD MWh
Offpeak Price
Peak Price
```

Rules:

- One row per month.
- `offpeak_mwh` should represent the Classic Offpeak MWh level.
- `peak_epad_mwh` should represent the Classic Peak EPAD MWh/area dimension relevant for the customer-facing report.
- Do not show raw `allocation.peak.*`, `base.*`, `peak.*` component rows in the normal Classic report.
- If the implementation currently has only a system-price physical volume carrier, document the approximation and keep naming consistent.

### Modern perspective columns

For Modern, show:

```text
month
base_mwh
peak_epad_mwh
base_price
peak_price
```

Display labels may be:

```text
Month
Base MWh
Peak EPAD MWh
Base Price
Peak Price
```

Rules:

- One row per month.
- `base_mwh` should represent Modern Base MWh.
- `peak_epad_mwh` should represent Modern Peak EPAD MWh/area dimension relevant for the customer-facing report.
- Do not show raw canonical component rows in the normal Modern report.
- Negative Modern Peak MWh is allowed if the existing projection logic allows it.

## 3. Position Report button behavior

`Position Report` should continue to support the perspective tabs:

```text
Baseloads
Classic
Modern
```

Switching perspective should keep the same selected year/portfolio where such state exists.

The Show button may remain if current implementation needs it, but if data is already rendered immediately elsewhere in the tool, keep behavior consistent with existing design. Do not spend scope on large UX redesign.

## 4. Baseloads Calloff List rows

Baseloads Calloff List should no longer show an empty placeholder when the selected portfolio has baseload calloff data or can derive synthetic calloff rows.

For each calloff, show two rows:

```text
SYS
EPAD
```

Required columns:

```text
date
synthetic_derivative_name
mwh
mw
price
```

Display labels may be:

```text
Date
Synthetic Derivative
MWh
MW
Price
```

Rules:

- Two rows per calloff: one system-price row and one EPAD/area row.
- Rows must not imply that SYS and EPAD are additive physical volumes.
- MWh and MW must both be shown.
- Price should use the relevant synthetic price for the row.
- Keep data synthetic.
- If the current PoC has no explicit baseload calloff entity, derive rows from existing baseload/position data using the smallest useful helper and document that derivation.

## 5. Synthetic derivative name terminology

Add a deterministic helper for synthetic derivative naming.

The helper should generate names that follow public Nordic power derivative terminology as closely as practical, while keeping values synthetic.

### Required market terminology research

Before implementation, Codex should check public Euronext/Nordic power derivative terminology or other public market documentation available to the developer environment.

The implementation report must state which public terminology source was used.

If exact Euronext product codes are unavailable or unclear, use a conservative generic naming pattern based on publicly known Nordic derivative concepts:

```text
Nordic Electricity Base Load Future
Nordic Electricity EPAD
```

and include:

```text
period type: Month / Quarter / Year if derivable
period: YYYY-MM or equivalent
price area for EPAD rows when available, e.g. SE3
synthetic marker if needed
```

Acceptable examples:

```text
Nordic Electricity Base Load Future Month 2027-01
Nordic Electricity EPAD SE3 Month 2027-01
```

or, if the codebase already has a naming convention, the same content in a compact machine-friendly display string.

### Naming rules

- SYS row should use a system/base-load derivative-style name.
- EPAD row should use an EPAD/area differential derivative-style name.
- Do not invent real exchange product codes unless verified from a public source.
- Do not use real trade IDs.
- Do not use real counterparty names.
- Keep names deterministic from row inputs.
- Add tests for at least one monthly SYS derivative name and one monthly EPAD derivative name.

## 6. Documentation updates

Update or add concise documentation in relevant docs, likely:

```text
docs/hedging/position_report.md
docs/hedging/baseloads_calloff_list.md
```

If derivative naming is centralized, also update or create a small doc section linked from:

```text
docs/hedging/component_catalog.md
```

Do not duplicate large model explanations.

## Required tests / validation

Add or update tests to validate at least:

1. feature menu contains `Position Report` but not a separate `Position` feature.
2. selecting/using legacy `Position` behavior, if supported, maps to `Position Report` or does not break existing tests.
3. Baseloads Position Report returns one row per month with exactly the required semantic columns.
4. Classic Position Report returns one row per month with exactly the required semantic columns.
5. Modern Position Report returns one row per month with exactly the required semantic columns.
6. normal Position Report output does not include raw `allocation.peak.*` component rows.
7. Baseloads Calloff List returns two rows per calloff: SYS and EPAD.
8. Baseloads Calloff List rows include date, synthetic derivative name, MWh, MW and price.
9. SYS synthetic derivative names follow the chosen public-market-style base-load naming pattern.
10. EPAD synthetic derivative names include EPAD/area-differential terminology and price area when available.
11. Existing P0037, P0038 and P0039 tests still pass.

Prefer focused functional tests over brittle full HTML snapshots.

## Non-goals

Do not redesign:

- canonical component formulas,
- Classic/Modern projection formulas,
- Data Viewer grouping from P0039,
- financial settlement,
- price API,
- purchase flow,
- database migration strategy.

Do not persist projected-only `modern.*` or `classic.*` names as canonical source-of-truth rows.

Do not introduce real derivative prices, real trade identifiers or copied market data.

## Expected result

After this package:

- The menu has one position feature: `Position Report`.
- Position Report is an aggregated monthly report, not a raw component table.
- Baseloads, Classic and Modern Position Report each have clear perspective-specific columns.
- Baseloads Calloff List shows useful synthetic SYS/EPAD rows per calloff.
- Calloff rows include synthetic derivative names using public-market-style terminology.
- The UI becomes less confusing on mobile and less likely to mix raw components with customer-facing report rows.

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
- feature-menu change,
- Position Report output shape per perspective,
- Baseloads Calloff List row shape,
- derivative naming source and fallback decision,
- tests added/updated,
- `npm test` result,
- `git diff --check` result,
- `REPOSITORY_FILES.md` status.
