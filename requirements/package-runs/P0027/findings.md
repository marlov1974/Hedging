# P0027 Findings

## Verification

`npm test` passed with 207 tests.

`git diff --check` passed after implementation.

## Implementation Notes

- Canonical peak components are now `peak.sys` and `peak.epad`.
- New Forecast Hedge transactions use `allocation.peak`, `base.sys`, `base.epad`, `peak.sys` and `peak.epad`.
- Compatibility aliases remain for `peak.modern.*` and `peak.premium.*`.
- Legacy Calloff List reads both canonical peak rows and legacy aliases.

## File Index

Tracked paths changed. `REPOSITORY_FILES.md` was updated for P0027 package-run files and the P0027 package file.

## Knowhow

No knowhow promotion was created. The package did not include live debugging, runtime anomalies, deploy/rollback lessons or repeated workflow problems.
