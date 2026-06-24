# P0042 value unit views review

## Classification

WARN

## Consistency result

The package is implementable and aligns with the P0041 normalized currency model: power rows keep EUR/MW semantics, while `currency.eursek` rows carry EUR quantity and SEK/EUR price.

There is one repository sequencing issue: this local worktree already contains a different local P0042 package for public price fixtures. The remote package is also numbered P0042. To avoid overwriting earlier evidence, this run stores review/design/function notes with `value-units` suffixes under the existing P0042 run directory.

## Scope assumptions

- Keep canonical transactions as source of truth.
- Add visible normalized fields and derived economics to views.
- Add currency rows to Classic/Modern projected transaction views where row-level tables exist.
- Convert Classic/Modern calloff and position report displayed prices/values to SEK for SEK portfolios when a matching `currency.eursek` row exists.
- Surface missing/partial currency coverage as warnings rather than throwing.

## Risk

This package touches shared reporting math. The implementation should keep EUR values available alongside display values so tests can verify value preservation and FX coverage behavior.
