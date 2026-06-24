# P0039 Review

## Classification

PASS.

## Evidence

- `src/hedging/dataViewer.ts` already separates raw canonical tables from Baseloads, Classic and Modern projected tables.
- `src/database/canonicalComponents.ts` already exposes component code classification through `componentCodeConcept`.
- `src/hedging/marketProjection.ts` already implements the required market projection semantics: include market-relevant base/peak/profile components and exclude allocation components.
- `src/hedging/HedgingToolView.ts` already has Data Viewer perspective tabs and a table selector that can expose the separation without changing portfolio or source data.

## Scope Decision

P0039 should add explicit Data Viewer group metadata, component concept visibility for raw/internal rows, and a small market/internal projection table. It should not redesign projections, seed data, canonical components or hedging workflows.

## Repository File Index

This package adds package-run evidence files and the local P0039 package file, so `REPOSITORY_FILES.md` must be updated.
