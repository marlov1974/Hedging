# P0028 Findings

## Verification

`npm test` passed with 209 tests.

`git diff --check` passed.

`git diff --cached --check` passed.

`REPOSITORY_FILES.md` matched `git ls-files` with 212 listed and 212 tracked paths.

## Implementation Notes

- New generated Peaks allocation rows use `allocation.peak.sys` and `allocation.peak.epad`.
- Deprecated `allocation.peak` remains readable as a compatibility row when old fixture data has no split allocation rows.
- Forecast Hedge now creates six transactions per month for Peaks.Modern.
- Market projection excludes both split allocation rows through category `allocation`.
- Legacy Calloff List derives one effective customer peak MW from split allocation rows, warns on sys/epad mismatch, and does not display allocation rows as customer rows.
- Data Viewer/internal raw views continue to show stored transaction rows, including split allocation rows.

## File Index

Tracked paths changed. `REPOSITORY_FILES.md` was updated for P0028 package-run files and the P0028 package file.

## Knowhow

No knowhow promotion was created. The package did not include live debugging, runtime anomalies, deploy/rollback lessons or repeated workflow problems.
