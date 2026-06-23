# Peaks.Classic Hedge Forecast Flow

## Purpose

`Hedge Forecast` supports a Peaks.Classic customer perspective for creating a hedge profile from monthly forecast values.

The customer-facing profile uses Peak/Offpeak terms:

```text
Offpeak MWh
Peak MWh
```

Persistence remains canonical. Accepting a hedge writes canonical component transactions only.

## Input Fields

The user selects:

```text
start_month
end_month
percentage
```

The percentage scales both Classic forecast values:

```text
hedge_classic_offpeak_mwh = forecast_classic_offpeak_mwh * percentage
hedge_classic_peak_mwh = forecast_classic_peak_mwh * percentage
```

## Editable Profile

The generated profile displays:

```text
Month
Forecast Offpeak MWh
Forecast Peak MWh
Hedge %
Offpeak MWh
Offpeak MW
Peak MWh
Peak MW
Total MWh
```

The editable fields are:

```text
Offpeak MWh
Peak MWh
```

Both customer-facing MWh fields must be greater than or equal to `0`.

## Accept Behavior

Accepting the profile creates one call-off and six canonical transactions per month:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

The accept flow must not persist projected `classic.*` components.

Classic and Modern projected rows can still be shown after accept because those rows are derived from canonical transactions.

## Q-Factor Usage

For every transaction, `q_factor` is read from the selected portfolio's linked product component Q-factor structure:

```text
PortfolioProductComponent -> QFactorSet -> QFactorValue month
```

Allocation rows use q-factor `0`. Base rows use the base q-factor. Peak rows use the peak q-factor.
