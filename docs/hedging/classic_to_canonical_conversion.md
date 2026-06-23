# Classic To Canonical Conversion

## Definitions

For each month:

```text
H = calendar.total_h
Hp = calendar.peak_h
Ho = H - Hp
```

Classic Projection values:

```text
classic.offpeak_mwh
classic.peak_mwh
```

## Classic To Canonical

Given user-facing values:

```text
classic.offpeak_mwh
classic.peak_mwh
```

calculate:

```text
classic_offpeak_mw = classic.offpeak_mwh / Ho
classic_peak_mw = classic.peak_mwh / Hp
total_mwh = classic.offpeak_mwh + classic.peak_mwh
canonical_base_mw = total_mwh / H
allocation_peak_mw = classic_peak_mw
canonical_peak_mw = allocation_peak_mw - canonical_base_mw
```

Write canonical transactions:

```text
allocation.peak.sys  = allocation_peak_mw
allocation.peak.epad = allocation_peak_mw
base.sys             = canonical_base_mw
base.epad            = canonical_base_mw
peak.sys             = canonical_peak_mw
peak.epad            = canonical_peak_mw
```

## Canonical To Classic

Given canonical base MW `B` and allocation peak MW `A`:

```text
total_mwh = B * H
classic.peak_mwh = A * Hp
classic.offpeak_mwh = total_mwh - classic.peak_mwh
classic_peak_mw = A
classic_offpeak_mw = classic.offpeak_mwh / Ho
```

The canonical relation is:

```text
A = B + P
```

where `P` is canonical peak MW. A warning is emitted if the relation is outside tolerance.

## Validation

Reject:

```text
H <= 0
Hp <= 0
Ho <= 0
classic.offpeak_mwh < 0
classic.peak_mwh < 0
```

Allow:

```text
canonical_peak_mw < 0
```

## Worked Example

Calendar:

```text
H = 744
Hp = 320
Ho = 424
```

Input:

```text
classic.offpeak_mwh = 50
classic.peak_mwh = 50
```

Result:

```text
classic_offpeak_mw = 0.117925
classic_peak_mw = 0.15625
canonical_base_mw = 0.134409
allocation_peak_mw = 0.15625
canonical_peak_mw = 0.021841
```
