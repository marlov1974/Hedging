# P0048 - Modern customer canonical

## Purpose

Make Modern the normal form for the customer leg.

Classic becomes a derived customer view. Baseloads entries are normalized into Modern customer basis.

## Requirements

1. Customer leg basis is Modern.
2. Customer leg components use `modern.base` and `modern.peak`.
3. Classic must not be stored as source of truth.
4. Classic views are derived from Modern customer rows.
5. Baseloads entries create `modern.base`; `modern.peak` is absent or zero.
6. Keep safe origin metadata where useful, such as original view/component.

## Tests

Cover:

1. Modern rows can be stored as customer legs.
2. Classic view can be derived from Modern rows.
3. Baseloads entry normalizes to Modern base.
4. Classic is not written as canonical source data.

## Non-goals

Market basis and Baseloads market projection are later packages.

## Verification

Run npm test, git status --short and git diff --check. Update REPOSITORY_FILES.md if tracked files change.
