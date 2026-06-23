# Product Packages And Feature Sets

## Packages

```text
Baseloads
Peaks.Classic
Peaks.Modern
Profiles.Classic
Profiles.Modern
```

## Feature Sets

```text
Peaks.Classic -> Classic Feature Set
Peaks.Modern  -> Modern Feature Set
```

Classic customer views present Peak/Offpeak terms.

Modern customer views present Base/Peak terms.

Both can use the same canonical component model underneath.

The canonical Peaks component set is:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

`allocation.peak.sys` and `allocation.peak.epad` are dimension-specific helper rows. They normally carry the same MW, have price `0` and q-factor `0`, and must not be summed as physical customer volume.

The first implemented Classic projection is:

```text
Peaks.Classic -> Legacy Calloff List
```

## Current PoC Scope

Baseloads and Peaks.Modern have active workflows in the current UI.

Profiles.Classic and Profiles.Modern reserve the same naming and canonical model direction but are not fully rebuilt in this package.
