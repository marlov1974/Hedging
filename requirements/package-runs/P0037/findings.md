# P0037 Findings

## Result

Implemented.

## Scope Delivered

- Created `docs/hedging/component_catalog.md`.
- Documented canonical Peaks source-of-truth components.
- Documented Modern projected `modern.*` components as projected only.
- Documented Classic projected `classic.*` components as projected only.
- Documented deprecated compatibility aliases.
- Documented projection listeners and sys/epad physical volume double-counting rules.
- Added cross-links from existing component and projection docs.
- Added a lightweight documentation test.

## Validation

```text
node --test tests/hedging/componentCatalog.test.ts
6 tests passed
```

Full package verification was run after implementation.

```text
npm test
262 tests passed
```

```text
git diff --check
passed
```

## File Index

Tracked files were added for the catalog, documentation test and P0037 package-run evidence. `REPOSITORY_FILES.md` was updated in this package.

## Knowhow

No knowhow promotion was created. This package was documentation/test consolidation and did not include live debugging or reusable operational discoveries.
