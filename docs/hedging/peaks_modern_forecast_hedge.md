# PeaksModern Forecast Hedge

## Purpose

`Hedge Forecast` is a PeaksModern feature for creating a base hedge profile from a percentage of monthly forecast.

The feature is only available for PeaksModern portfolios in this PoC.

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
hedge_mw = hedge_mwh / calendar.total_h
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
Hedge %
Hedge MWh
Hedge MW
```

`Hedge MWh` is editable. `Hedge MW` and `Hedge %` are derived values:

```text
Hedge MW = Hedge MWh / calendar.total_h
Hedge % = Hedge MWh / Forecast MWh
```

The browser view recalculates the displayed derived values while editing. The server recalculates the same values again when the profile is accepted.

## Accept Behavior

Accepting the profile creates exactly one call-off for the selected PeaksModern portfolio.

The call-off uses the PeaksModern product configuration and the selected portfolio.

## Transaction Creation

For each profile month, the PoC creates one transaction for each base component:

```text
base.sys
base.epad
```

Each transaction uses the month Hedge MW.

## Q-Factor Usage

For every transaction, `q_factor` is read from the selected portfolio's linked product component Q-factor structure:

```text
PortfolioProductComponent -> QFactorSet -> QFactorValue month
```

For seeded base components, the expected q-factor is `1.0`.

## Known PoC Limitations

- Peak modern component transactions are not created in this package.
- The profile draft is posted through the form rather than stored server-side.
- Price preview is not part of this package.
