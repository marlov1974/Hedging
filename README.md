# Hedging

Public-safe source-of-truth repository for a generic hedging and settlement modelling prototype.

This repository is intentionally sanitized. It must not contain customer names, company names, internal product names, real contract terms, real prices, real forecasts, internal system names, screenshots, exports, or copied proprietary documentation.

## Mandatory AI bootstrap

For every new AI/chat/Codex session working on this repository:

1. Read this `README.md`.
2. Read `AGENTS.md`.
3. Read `memory/bootstrap-manifest.json`.
4. Read every file listed in the manifest `read_order`, in order.
5. Read `REPOSITORY_FILES.md` as the tracked path index when file discovery is needed, when planning source/package inspection, or when a task may add, remove or move tracked files.
6. Treat `REPOSITORY_FILES.md` as a catalog, not as a command to read every tracked file during ordinary bootstrap.
7. Read the active package in `requirements/packages/` before editing.
8. If any mandatory read fails, stop and report `BOOTSTRAP FAILED` with the missing file/step.

## Public-safety boundary

This repository may contain:

- generic component names,
- abstract calculation examples,
- synthetic volumes, prices and calendars,
- prototype code,
- non-confidential design notes.

This repository must not contain:

- real customer information,
- real commercial terms,
- real internal product names,
- real counterparties or business unit names,
- real system names,
- real price curves or transaction extracts,
- copied internal documents.

Use neutral vocabulary such as:

```text
standard configuration
contract part
call-off
customer transaction
market component
shape component
risk component
settlement view
```

## Layout

```text
memory/        durable sanitized solution understanding
requirements/ epics, features, stories and ordered packages
src/           prototype source code
tests/         unit tests and fixtures
docs/          durable design and function documentation
```

Tracked repository paths are listed in `REPOSITORY_FILES.md`. When a change adds, removes or moves tracked files, keep `REPOSITORY_FILES.md` synchronized in the same change.

## Package model

All implementation work is package-driven.

A package is an ordered whole-solution change version:

```text
P0001, P0002, P0003, ...
```

Every code change must reference exactly one package id. Rollback is also a new forward-moving package.

Current bootstrap package:

```text
requirements/packages/P0001-bootstrap-cleanup.md
```
