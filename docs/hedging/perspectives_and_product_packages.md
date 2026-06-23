# Perspectives And Product Packages

Product package metadata remains part of the model:

- Baseloads
- Peaks.Classic
- Peaks.Modern
- Profiles.Classic
- Profiles.Modern

A product package describes configured contract/product metadata. A perspective describes how the tool shows the same canonical rows to a user.

The PoC deliberately allows one selected portfolio to show Baseloads, Classic and Modern perspectives. This is a demonstration mode, not production entitlement logic.

Canonical components are stored as source-of-truth rows, for example:

- `allocation.peak.sys`
- `allocation.peak.epad`
- `base.sys`
- `base.epad`
- `peak.sys`
- `peak.epad`

Projected components such as `modern.base.sys` or Classic Peak/Offpeak rows are derived output. They must not be inserted as raw canonical transactions unless a future package explicitly materializes derived view data and marks it rebuildable.
