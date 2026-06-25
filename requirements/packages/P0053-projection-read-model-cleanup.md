# P0053 - Projection/read model cleanup

## Purpose

Clean up reports, data viewer and read models after the two-legged target model has been introduced.

## Requirements

Data Viewer should clearly show:

```text
raw customer legs
raw market legs
Modern customer canonical
Classic projection
Baseloads projection
Market basis position
```

Reports should use the correct source:

```text
Modern report    -> Modern customer canonical
Classic report   -> projection from Modern customer canonical
Baseloads report -> projection from Market canonical
Settlement       -> Market canonical
```

Remove or isolate old logic where Classic, Modern and Baseloads behave as parallel canonical models.

## Tests

Cover:

1. Data Viewer exposes both leg types.
2. Modern report reads Modern customer basis.
3. Classic report reads Classic projection.
4. Baseloads report reads Market basis projection.
5. Settlement reads Market basis.
6. Old projection paths are not silently used as canonical sources.

## Non-goals

Do not change the canonical model again in this package. It is a read/projection cleanup package.

## Verification

Run npm test, git status --short and git diff --check. Update REPOSITORY_FILES.md if tracked files change.
