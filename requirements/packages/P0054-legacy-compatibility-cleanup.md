# P0054 - Legacy compatibility cleanup

## Purpose

Clean up compatibility code, docs and seed data after the target model migration.

## Requirements

1. Document deprecated component names and old projection paths.
2. Keep compatibility only where still needed by tests or UI.
3. Migrate seed data to the two-legged model where useful.
4. Remove or isolate obsolete Classic/Modern/Baseloads-as-canonical assumptions.
5. Update documentation so the target model is clear.
6. Ensure public-safe synthetic data only.
7. Keep `REPOSITORY_FILES.md` synchronized.

## Tests

Cover:

1. Deprecated aliases still work where intentionally supported.
2. New seed data follows the two-legged model.
3. Removed paths are no longer used by reports.
4. Existing user-facing flows still work.

## Non-goals

Do not introduce new business logic in this package. This is cleanup and compatibility consolidation.

## Verification

Run npm test, git status --short and git diff --check. Update REPOSITORY_FILES.md if tracked files change.
