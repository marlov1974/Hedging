# PeaksModern Forecast feature

P0021 adds the Forecast feature for PeaksModern portfolios.

## Purpose

The feature lets the user view and edit monthly forecast values for the selected PeaksModern portfolio.

## Data Source

The feature uses existing `CustomerForecast` rows:

```text
portfolio_id
month
mwh
peak_pct
```

## Field Semantics

`mwh` is total monthly customer consumption forecast.

`peak_pct` is the share of monthly volume/profile allocated to peak information for later PeaksModern exposure logic.

## Display And Storage Convention

The UI displays:

```text
Peak %
```

as a percent value between `0` and `100`.

The database stores:

```text
peak_pct
```

as a decimal value between `0` and `1`.

Example:

```text
57.5% in the UI -> 0.575 in storage
```

## Year Filter

The feature uses a year dropdown. Current seed data covers:

```text
2027
2028
2029
```

Each populated year shows 12 monthly rows.

## Save Behavior

The current implementation saves all rows for the selected year in one form submit.

After save:

```text
updated MWh values are visible in the UI
updated Peak % values are visible in the UI
in-memory forecast rows are updated
```

## Validation

The feature rejects:

```text
non-PeaksModern portfolio updates
invalid month format
missing MWh
non-numeric MWh
MWh less than 0
missing Peak %
non-numeric Peak %
Peak % less than 0
Peak % greater than 100
```

## Known PoC Limitations

- Forecast edits are in-memory only.
- Forecast changes do not yet recalculate hedge positions.
- Forecast is currently a PeaksModern-specific feature.
