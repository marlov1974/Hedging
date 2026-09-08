# P0038 Findings

## Result

Implemented.

## Files Inspected

- `src/database/canonicalComponents.ts`
- `src/database/validation.ts`
- `src/database/pocSeedData.ts`
- `src/database/fixtures.ts`
- `src/database/schema.ts`
- `src/database/repository.ts`
- `src/hedging/modernProjection.ts`
- `src/hedging/classicProjection.ts`
- `src/hedging/dataViewer.ts`
- `src/hedging/forecastFeature.ts`
- `src/hedging/forecastHedge.ts`
- `src/hedging/marketProjection.ts`
- `src/hedging/peaksCalloffTransactionList.ts`
- `src/hedging/positionReport.ts`
- `tests/database/`
- `tests/hedging/`

## Runtime Classification Approach

`src/database/canonicalComponents.ts` now classifies component-like strings as:

```text
canonical
projected
compatibility_alias
reserved
unknown_adjustment
```

`validation.ts` now delegates persisted component-code checks to this central classification instead of keeping a separate known-code list.

## Projected-Only Guard Behavior

Projected-only component names are known view/output names but are not persistable as product component or q-factor component metadata.

Guarded projected names:

```text
modern.base.sys
modern.base.epad
modern.peak.sys
modern.peak.epad
classic.offpeak.sys
classic.offpeak.epad
classic.peak.sys
classic.peak.epad
```

Projected Data Viewer rows can still emit `modern.*` names because they are not persisted source-of-truth rows.

## Alias Behavior

Retained compatibility behavior:

```text
peak.premium.sys -> peak.sys
peak.premium.epad -> peak.epad
peak.modern.sys -> peak.sys
peak.modern.epad -> peak.epad
```

`allocation.peak` remains a legacy compatibility component with allocation metadata. It is not automatically expanded into split sys/epad rows.

## Older Metadata Entries

Older metadata entries were retained as reserved/compatibility metadata rather than removed. This avoids breaking package history and existing fixtures while making them explicit as outside the current target Peaks source-of-truth component set.

Examples retained:

```text
base
sys
epad
base.classic.sys
base.classic.epad
peak.classic.sys
peak.classic.epad
profile.peak
profile.15m
volume.flex
fixed
calendar
currency.sek
```

## Tests

Added `tests/database/componentCodes.test.ts`.

Validated:

- target Peaks canonical codes are source-of-truth capable,
- Modern projected names are projected-only,
- Classic projected names are projected-only,
- projected-only names are rejected by persisted metadata insertion,
- deprecated aliases remain explicit and compatible,
- market projection still excludes allocation.

## Verification

```text
npm test
270 tests passed
```

## File Index

`REPOSITORY_FILES.md` was updated in this package.

## Knowhow

No knowhow promotion was created. This package did not include live debugging or reusable operational discoveries outside the documented P0038 runtime classification rules.
