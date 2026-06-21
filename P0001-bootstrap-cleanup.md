# P0001 - Bootstrap cleanup

## Purpose

Create a clean public-safe repository bootstrap so future AI and Codex sessions can work package-by-package.

## Safety boundary

This repository is public-safe and generic.

Do not add:

- real customer names
- real company names
- real internal product names
- real system names
- real prices
- real forecasts
- real contract terms
- copied internal documents

Use only synthetic examples and neutral terms.

## Required work

1. Sync the local repository with origin.
2. Read `README.md` and `AGENTS.md`.
3. Remove temporary `test.txt`.
4. Create the intended package structure:

```text
memory/
requirements/packages/
requirements/package-runs/
src/
tests/
docs/
```

5. Move this package into:

```text
requirements/packages/P0001-bootstrap-cleanup.md
```

6. Add minimal placeholder index files where useful so the folders are tracked.
7. Create `memory/bootstrap-manifest.json` with a short read order.
8. Update `REPOSITORY_FILES.md` so it matches tracked files.

## Minimal read order

The bootstrap manifest should include:

```text
memory/00-index.md
memory/01-project-overview.md
memory/02-design-principles.md
memory/03-component-model.md
requirements/README.md
requirements/packages/P0001-bootstrap-cleanup.md
```

## Verification

Run:

```bash
git status --short
git ls-files
```

Confirm that:

- `test.txt` is removed.
- `REPOSITORY_FILES.md` matches `git ls-files`.
- All text uses generic terminology only.
- No sensitive or proprietary names were introduced.

## Expected result

A clean bootstrap repository ready for the next package.
