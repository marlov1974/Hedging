# P0028 Review

## Consistency Result

PASS.

P0028 is consistent with the current canonical component model after P0027. The existing implementation still uses one unsuffixed `allocation.peak` target row, while P0028 requires dimension-specific helper rows:

```text
allocation.peak.sys
allocation.peak.epad
```

The requested split is implementable without changing the product package hierarchy, peak component names, settlement, or Modern Projection UI.

## Evidence

- `src/database/canonicalComponents.ts` currently treats `allocation.peak` as the canonical allocation component.
- `src/database/pocSeedData.ts` currently seeds `allocation.peak` for Peaks.Classic, Peaks.Modern and Profiles.Modern.
- `src/hedging/forecastHedge.ts` currently creates five rows per month including `allocation.peak`.
- `src/hedging/legacyCalloffList.ts` currently reads one `allocation.peak` row for legacy peak volume.

## Assumptions

- `allocation.peak` remains a read compatibility alias, not a new write target.
- Raw/internal views need no special filtering because they already display stored transaction rows.
- Market projection continues to exclude allocation rows through component category.
