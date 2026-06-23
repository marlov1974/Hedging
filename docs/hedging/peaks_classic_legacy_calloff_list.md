# Peaks.Classic Legacy Calloff List

## Purpose

`Legacy Calloff List` is the first Classic Feature Set projection.

It presents Peaks.Classic calloffs as customer-facing Peak and Offpeak rows while using the canonical component model underneath.

## Inputs

The projection reads canonical rows:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

`allocation.peak.sys` and `allocation.peak.epad` drive legacy peak volume. They normally carry the same MW, are not shown as separate customer rows and have no projected value.

If the split allocation rows differ, the projection warns and uses `allocation.peak.sys` as the effective customer volume carrier. Deprecated `allocation.peak` rows are read only as a compatibility alias when split rows are absent.

## Volume Projection

For each calloff month:

```text
base_mwh = base_mw * total_h
legacy_peak_mw = allocation_peak_mw
legacy_peak_mwh = allocation_peak_mw * peak_h
legacy_offpeak_mwh = base_mwh - legacy_peak_mwh
legacy_offpeak_mw = legacy_offpeak_mwh / offpeak_h
```

If `base.sys` and `base.epad` MW differ, the projection warns and uses `base.sys` as the volume carrier.

If only one base row exists, the projection warns and uses the available row.

Do not sum `allocation.peak.sys` and `allocation.peak.epad` as physical customer volume.

## Display

The UI shows:

```text
Date
Calloff
Period
Block
MW
MWh
Price
Value
Warnings
```

`Block` is either `Peak` or `Offpeak`.

Multi-month calloffs aggregate by block. Aggregated price is value-weighted:

```text
aggregated_price = aggregated_value / aggregated_mwh
```

It is not an arithmetic average of monthly prices.

## Raw Data

The Legacy Calloff List is a customer projection.

Raw canonical rows remain visible in Data Viewer, including `allocation.peak.sys` and `allocation.peak.epad`.
