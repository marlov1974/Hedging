# P0032 Findings

## Verification Notes

- P0032 corrects the loose P0031 Data Viewer projections by exposing explicitly named Modern projected views.
- Raw canonical Data Viewer rows remain available through `Calloffs` and `Transactions`.
- Modern projected transaction components are constrained to `modern.base.sys`, `modern.base.epad`, `modern.peak.sys`, and `modern.peak.epad`.
- Modern projected calloffs use sys rows as physical volume carriers and combine sys plus epad values into all-in base and peak prices.

## Commands

```text
npm test
git status --short
git diff --check
git diff --cached --check
REPOSITORY_FILES.md matches git ls-files
```

Result:

```text
tests 225
suites 20
pass 225
fail 0
```

## REPOSITORY_FILES.md

P0032 adds package-run evidence and durable Modern projection documentation. `REPOSITORY_FILES.md` was regenerated and verified against `git ls-files`.
