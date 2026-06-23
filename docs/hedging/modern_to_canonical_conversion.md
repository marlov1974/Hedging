# Modern To Canonical Conversion

## Definitions

For each month:

```text
H = calendar.total_h
Hp = calendar.peak_h
Ho = H - Hp
```

Modern Projection values:

```text
modern.base_mwh = modern_base_mw * H
modern.peak_mwh = modern_peak_mw * Hp
```

## Modern To Canonical

Given user-facing values:

```text
modern.base_mwh
modern.peak_mwh
```

calculate:

```text
modern_base_mw = modern.base_mwh / H
modern_peak_mw = modern.peak_mwh / Hp
allocation_peak_mw = modern_base_mw + modern_peak_mw
canonical_base_mw = (modern.base_mwh + modern.peak_mwh) / H
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

## Canonical To Modern

Given canonical base MW `B` and allocation peak MW `A`:

```text
total_mwh = B * H
peak_level_mwh = A * Hp
offpeak_mwh = total_mwh - peak_level_mwh
modern_base_mw = offpeak_mwh / Ho
modern_peak_mw = A - modern_base_mw
modern.base_mwh = modern_base_mw * H
modern.peak_mwh = modern_peak_mw * Hp
```

## Validation

Reject:

```text
H <= 0
Hp <= 0
Ho <= 0
modern.base_mwh < 0
total_mwh < 0
peak_level_mwh < 0
```

Allow:

```text
modern.peak_mwh < 0
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
modern.base_mwh = 87.735849
modern.peak_mwh = 12.264151
```

Result:

```text
modern_base_mw = 0.117925
modern_peak_mw = 0.038325
allocation_peak_mw = 0.15625
canonical_base_mw = 0.134409
canonical_peak_mw = 0.021841
```
