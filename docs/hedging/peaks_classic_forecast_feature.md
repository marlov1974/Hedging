# Peaks.Classic Forecast Feature

For projected Classic names and canonical storage rules, see [Component Catalog](component_catalog.md).
For forecast event storage, see [Event Detail Model](event_detail_model.md).

## Purpose

`Forecast` supports a Peaks.Classic customer perspective for viewing and editing monthly forecast values in Peak/Offpeak terms.

The user edits:

```text
Offpeak MWh
Peak MWh
```

The source model stores forecast as a canonical `FORECAST` event with price-area event details. The compatibility database layer still keeps the existing internal forecast fields:

```text
mwh
peak_pct
```

No `classic.*` forecast rows or components are persisted.

## Customer-Facing Semantics

Classic Offpeak MWh is the forecast volume assigned to non-peak hours.

Classic Peak MWh is the forecast volume assigned to peak hours.

```text
total_mwh = classic.offpeak_mwh + classic.peak_mwh
peak_pct = classic.peak_mwh / total_mwh
```

When `total_mwh` is `0`, `peak_pct` is stored as `0`.

## Save Behavior

When a user saves Classic forecast values, the feature converts them to internal forecast storage:

```text
classic_offpeak_mw = classic.offpeak_mwh / offpeak_h
classic_peak_mw = classic.peak_mwh / peak_h
total_mwh = classic.offpeak_mwh + classic.peak_mwh
peak_pct = classic.peak_mwh / total_mwh
```

Then it stores:

```text
CustomerForecast.mwh = total_mwh
CustomerForecast.peak_pct = peak_pct
```

The saved compatibility row is synced back to canonical forecast event details.

## Validation

The feature rejects:

```text
invalid month format
missing Offpeak MWh
non-numeric Offpeak MWh
Offpeak MWh less than 0
missing Peak MWh
non-numeric Peak MWh
Peak MWh less than 0
zero or invalid calendar total_h, peak_h, or offpeak_h
```

## Known PoC Limitations

- Forecast edits are in-memory only.
- Forecast changes do not automatically create hedge positions.
- Classic Forecast is a projection over the shared internal forecast shape.
