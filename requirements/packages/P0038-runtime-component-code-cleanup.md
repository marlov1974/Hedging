# P0038 - Runtime component code cleanup

## Purpose

Clean up runtime component-code handling after the component catalog consolidation in P0037.

The goal is to make it harder for the codebase to confuse:

1. canonical source-of-truth component codes,
2. projected component names used only in Classic or Modern views,
3. deprecated compatibility aliases,
4. older metadata entries that may still exist only for fixture/test compatibility.

This is a cleanup and guardrail package. It should reduce ambiguity without redesigning the hedging model.

## Background

P0037 created `docs/hedging/component_catalog.md` as the canonical glossary for component codes and projected component-like names.

The current runtime code still contains a mix of target canonical codes, compatibility aliases and older metadata entries. Some of that may still be needed for tests or fixtures, but the intent must be explicit.

Current target canonical Peaks source-of-truth components are:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

Projected names such as `modern.*` and `classic.*` must not become persisted source-of-truth transaction component codes.

Deprecated aliases may be read for compatibility, but new data and new tests should prefer target names.

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

## Scope

### 1. Inspect runtime component handling

Review component-code handling in at least:

```text
src/database/canonicalComponents.ts
src/database/validation.ts
src/database/pocSeedData.ts
src/database/fixtures.ts
src/database/schema.ts
src/database/repository.ts
src/hedging/modernProjection.ts
src/hedging/classicProjection.ts
src/hedging/dataViewer.ts
src/hedging/forecastFeature.ts
src/hedging/forecastHedge.ts
src/hedging/marketProjection.ts
src/hedging/peaksCalloffTransactionList.ts
src/hedging/positionReport.ts
```

Also inspect tests under:

```text
tests/database/
tests/hedging/
```

Do not assume every listed file must change. The inspection is required so changes are deliberate.

### 2. Classify component-code concepts explicitly

In runtime code, create or clarify a small explicit distinction between:

```text
canonical component code
projected component code
compatibility alias
reserved component code
unknown/adjustment fallback
```

The exact implementation is up to Codex, but it should be simple and consistent with the existing code style.

Acceptable outcomes include:

- a clearer set of exported constants/functions in `src/database/canonicalComponents.ts`, or
- a small helper module if that is cleaner, or
- comments and tests if runtime structure is already sufficient.

Avoid over-engineering.

### 3. Guard source-of-truth persistence

Add lightweight protection so projected-only component names are not accepted as persisted canonical transaction component codes unless a test explicitly verifies they are projected-only.

Projected-only names include at least:

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

The protection should not block projected views from emitting projected names when those names are clearly view/output-only.

### 4. Clarify deprecated aliases

Deprecated aliases should remain temporary compatibility only.

At minimum, review and document/encode the current behavior for:

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

- old aliases may be read if existing fixtures/tests still require them,
- new seed/reference data should use target canonical names,
- new docs/tests should prefer target names,
- aliases are not a production migration strategy.

If `allocation.peak` is not currently implemented as a true one-to-two alias, document the actual behavior and avoid pretending it is fully migrated.

### 5. Review older metadata entries

Review older component metadata entries such as:

```text
base
peak
offpeak
base.classic.sys
base.classic.epad
peak.classic.sys
peak.classic.epad
profile.peak
profile.15m
volume.flex
fixed
calendar
```

For each category, decide whether the entries should be:

1. retained as compatibility/reserved metadata,
2. converted to explicit aliases,
3. removed from tests/fixtures if obsolete,
4. left unchanged but documented as out of target Peaks source-of-truth scope.

Do not remove entries aggressively if they still support existing package history or tests.

### 6. Align seed/reference data where safe

Review `src/database/pocSeedData.ts` and `src/database/fixtures.ts`.

Where safe, prefer target canonical names for new/current Peaks seed data:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

Do not perform large seed redesigns in this package.

### 7. Keep projections separate from canonical data

Verify that Modern and Classic projected component names are only used in projection/view outputs, not as persisted source-of-truth rows.

Modern projected names are allowed in:

```text
Modern Projected Transactions
Modern Projected Calloffs
Modern Feature Set / Base-Peak views
Data Viewer projected views
```

Classic projected names are allowed in Classic projected views if implemented.

### 8. Update documentation only where useful

Update or add short cross-links if needed in:

```text
docs/hedging/component_catalog.md
docs/hedging/canonical_component_model.md
docs/hedging/data_viewer.md
docs/hedging/modern_projected_model.md
docs/hedging/modern_projected_transactions.md
docs/hedging/classic_projection_peak_offpeak_rules.md
```

Do not duplicate the component catalog across many files.

## Required tests / validation

Add or update tests to validate at least:

1. all target canonical Peaks component codes are recognized as canonical/source-of-truth-capable,
2. all Modern projected component names are recognized as projected-only,
3. all Classic projected component names are recognized as projected-only,
4. projected-only component names are not accepted where persisted canonical transaction component codes are required,
5. deprecated aliases resolve or behave exactly as documented,
6. market projection still excludes allocation components,
7. customer/internal projection behavior is unchanged except where explicitly cleaned up,
8. existing P0037 component catalog test still passes.

If a validation layer does not yet have a clean hook for source-of-truth persistence, add the smallest useful helper/test seam rather than a large validation framework.

## Non-goals

Do not redesign:

- canonical component formulas,
- Classic/Modern projection formulas,
- forecast or hedge forecast flows,
- market projection semantics,
- financial settlement,
- UI feature navigation,
- database migration strategy.

Do not introduce real data or business-specific naming.

Do not persist `modern.*` or `classic.*` component names as canonical source-of-truth rows.

## Expected result

After this package:

- runtime terminology should match `docs/hedging/component_catalog.md`,
- source-of-truth component codes should be explicit,
- projected component names should be clearly view-only,
- deprecated aliases should be isolated and documented,
- older metadata entries should be either justified or cleaned up,
- tests should catch accidental persistence of projected component names,
- all existing package behavior should remain stable unless explicitly corrected.

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
- runtime classification approach,
- projected-only guard behavior,
- alias behavior retained/changed,
- older metadata entries retained/removed and why,
- tests added/updated,
- `npm test` result,
- `git diff --check` result,
- `REPOSITORY_FILES.md` status.
