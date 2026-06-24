# P0040 Review

## Classification

PASS with one implementation assumption.

## Evidence

- `Position` and `Position Report` are both listed in `src/hedging/applicationConfig.ts`.
- `src/hedging/HedgingToolView.ts` renders `position` and `position-report` with duplicated table structure.
- `src/hedging/positionReport.ts` currently returns one row per month and canonical component, which is too raw for the P0040 report shape.
- `src/hedging/calloffList.ts` already derives Baseloads rows from calloff transactions and can be extended to include MW and synthetic derivative naming.
- `src/hedging/derivativeNames.ts` already centralizes deterministic derivative display names.

## Public Terminology Source

Public sources checked:

- Euronext/Nord Pool public information confirms Nordic power market context and Euronext ownership/operation context.
- Public EPAD terminology describes Electricity Price Area Differentials as contracts for area price risk.

Implementation uses conservative synthetic names:

```text
Nordic Electricity Base Load Future
Nordic Electricity EPAD
```

No real exchange product codes are introduced.

## Assumption

Classic and Modern Position Report use existing calloff projection logic. The EPAD-labelled peak MWh fields are customer-facing area-dimension report fields; the current model carries the same projected MWh level for sys and epad dimensions, so the report uses the projection MWh and labels the peak field as EPAD-relevant.

## Repository File Index

This package adds package and package-run files plus new docs, so `REPOSITORY_FILES.md` must be updated.
