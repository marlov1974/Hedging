# Peaks.Modern Forecast Feature

For projected Modern names and canonical storage rules, see [Component Catalog](component_catalog.md).
For forecast event storage, see [Event Detail Model](event_detail_model.md).

## Purpose

`Forecast` is a Peaks.Modern customer-facing feature for viewing and editing monthly forecast values in Modern Projection terms.

The user edits:

```text
Modern Base MWh
Modern Peak MWh
```

The source model stores forecast as a canonical `FORECAST` event with price-area event details. The compatibility database layer still keeps the existing internal forecast fields:

```text
mwh
peak_pct
```

## Customer-Facing Semantics

Modern base is the base layer applied across the whole month.

Modern peak is the extra peak layer applied during peak hours. It may be negative.

```text
modern.base_mwh = modern_base_mw * total_h
modern.peak_mwh = modern_peak_mw * peak_h
total_mwh = modern.base_mwh + modern.peak_mwh
```

## Save Behavior

When a user saves modern forecast values, the feature converts them to internal forecast storage:

```text
modern_base_mw = modern.base_mwh / total_h
modern_peak_mw = modern.peak_mwh / peak_h
allocation_peak_mw = modern_base_mw + modern_peak_mw
total_mwh = modern.base_mwh + modern.peak_mwh
peak_level_mwh = allocation_peak_mw * peak_h
peak_pct = peak_level_mwh / total_mwh
```

Then it stores:

```text
CustomerForecast.mwh = total_mwh
CustomerForecast.peak_pct = peak_pct
```

The saved compatibility row is synced back to canonical forecast event details. Canonical forecast details store power as MW; displayed MWh is derived with `total_h` for `base.<area>` and `peak_h` for `peak.<area>`.

## Validation

The feature rejects:

```text
non-Peaks.Modern portfolio updates
invalid month format
missing Modern Base MWh
non-numeric Modern Base MWh
Modern Base MWh less than 0
missing Modern Peak MWh
non-numeric Modern Peak MWh
total MWh less than 0
peak level MWh less than 0
zero or invalid calendar total_h, peak_h, or offpeak_h
```

## Known PoC Limitations

- Forecast edits are in-memory only.
- Forecast changes do not automatically create hedge positions.
- Forecast is currently a Peaks.Modern-specific feature.
