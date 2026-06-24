# P0043 - Projected model report basis

## Purpose

Clarify and enforce that the canonical model is the source of truth, while Classic and Modern are explicit projected models. Data Viewer should show these projected models, and downstream reports/lists should be built on projected model rows rather than recalculating directly from raw canonical rows when a corresponding projected model exists.

## Core design decision

The model has three layers:

```text
1. Canonical model
2. Projected models
3. Reports and customer-facing views
```

Rules:

```text
Canonical model -> Classic projected model -> Classic reports/views
Canonical model -> Modern projected model  -> Modern reports/views
```

## Required work

1. Define clear Classic and Modern projected model row contracts.
2. Ensure Data Viewer exposes canonical, Classic projected and Modern projected views.
3. Make Classic/Modern Calloff List use projected model output.
4. Make Classic/Modern Position Report use projected model output.
5. Carry `currency.eursek` rows through projected models where relevant.
6. Keep projected component names out of persisted canonical source rows.
7. Update documentation to describe the projected model basis.

## Safety boundary

Keep all work public-safe and generic. Do not add real customer names, company names, internal product names, real prices, real forecasts, contract terms, credentials or copied internal documents.

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

If tracked files are added, removed or moved, update `REPOSITORY_FILES.md` to match `git ls-files`.
