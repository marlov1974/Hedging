# Peaks.Modern Forecast Hedge

## Purpose

`Hedge Forecast` is a Peaks.Modern feature for creating a component hedge profile from a percentage of monthly forecast.

The feature is only available for Peaks.Modern portfolios in this PoC.

## Input Fields

The user selects:

```text
start_month
end_month
percentage
```

Months use `YYYY-MM`. Percentage is displayed as a percent value from `0` to `100`.

## Forecast To Hedge Formula

For every month in the selected range:

```text
hedge_mwh = forecast_mwh * percentage
base_mw = hedge_mwh / calendar.total_h
allocation_peak_mw = hedge_mwh * forecast_peak_pct / calendar.peak_h
peak_mw = allocation_peak_mw - base_mw
peak_mwh = peak_mw * calendar.peak_h
```

The percentage input is converted from percent to decimal before calculation.

Example:

```text
50% -> 0.50
```

## Editable Hedge Profile

The generated profile displays:

```text
Month
Forecast MWh
Peak %
Hedge %
Base MWh
Base MW
Allocation Peak MW
Peak MWh
Peak MW
```

`Base MWh` is editable. `Base MW`, `Hedge %` and peak allocation values are derived values:

```text
Base MW = Base MWh / calendar.total_h
Hedge % = Base MWh / Forecast MWh
Allocation Peak MW = Base MWh * Forecast Peak % / calendar.peak_h
Peak MW = Allocation Peak MW - Base MW
Peak MWh = Peak MW * calendar.peak_h
```

The browser view recalculates the displayed derived values while editing. The server recalculates the same values again when the profile is accepted.

## Accept Behavior

Accepting the profile creates exactly one call-off for the selected Peaks.Modern portfolio.

The call-off uses the Peaks.Modern product configuration and the selected portfolio.

## Transaction Creation

For each profile month, the PoC creates one transaction for each Peaks.Modern component:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

Base transactions use `hedge_mwh / calendar.total_h`.

`allocation.peak.sys` and `allocation.peak.epad` use `hedge_mwh * forecast_peak_pct / calendar.peak_h`, price `0`, and q-factor `0`. They normally carry the same MW and must not be summed as physical customer volume.

`peak.sys` uses `allocation.peak.sys - base.sys`. `peak.epad` uses `allocation.peak.epad - base.epad`.

Peak MWh and MW may be negative. Negative values mean the forecast peak share is lower than the flat base share implied by the calendar.

## Q-Factor Usage

For every transaction, `q_factor` is read from the selected portfolio's linked product component Q-factor structure:

```text
PortfolioProductComponent -> QFactorSet -> QFactorValue month
```

For seeded base components, the expected q-factor is `1.0`. Peak components use separate seeded q-factor sets with non-base values.

## Known PoC Limitations

- The profile draft is posted through the form rather than stored server-side.
- Price preview is not part of this package.
