# P0041 Review

## Classification

WARN.

## Consistency Result

The package is implementable as a compatibility step, but a full database/model rewrite would be too broad while P0039, P0040 and P0042 are still uncommitted in the working tree.

P0041 can be delivered safely by adding explicit normalized transaction fields alongside existing `mw`/`q_factor` compatibility fields, adding portfolio currency, introducing `currency.eursek`, and adding helper flows for explicit Classic/Modern purchase normalization.

## Evidence

- `CustomerPortfolio` currently has no currency field.
- `CustomerTransaction` currently stores `mw` and `q_factor` only.
- `currency.sek` exists as a reserved component but the package requires `currency.eursek` with explicit currency semantics.
- Market projection already filters by component category, so a `currency` category component will be excluded from power exposure.
- Current forecast hedge flow is percentage-based, so explicit purchase helpers can be added without removing forecast-as-reference UI behavior in this package.

## Assumptions

- Existing code can continue reading `mw`/`q_factor`; new normalized fields document the target semantics and are populated for new flows.
- Currency rows use `mw = 0` and `q_factor = 0` for compatibility, while normalized fields carry the actual EUR quantity and SEK/EUR rate.
- The package adds focused explicit purchase helper functions and tests rather than a full UI redesign.

## Repository File Index

This package adds a package file and package-run evidence files. `REPOSITORY_FILES.md` must be updated.
