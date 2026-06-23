# P0035 Findings

## Result

Implemented.

## Notes

- Main UI uses one demo portfolio, `CUS00-0`, and does not expose the product-specific fixture portfolios as primary choices.
- Global perspective selection was removed from the shell.
- Feature navigation uses generic feature labels.
- Perspective switching moved into Forecast, Hedge Forecast, Calloff List, Position Report, Position and Data Viewer.
- Hedge Baseload remains a single feature without perspective tabs.
- Data Viewer separates Canonical raw rows from Baseloads, Classic and Modern projected views.
- Existing product-specific fixture portfolios remain available for model/helper tests.
- System-filled editable Forecast and Hedge Forecast values are rounded to at most three decimals to match `step="0.001"` inputs.

## Verification

- `npm test`
- `git diff --check`
- `git status --short`

## Repository file index

`REPOSITORY_FILES.md` was regenerated to include the new P0035 docs and package-run evidence files.
