# Peaks.Modern Hedge Forecast Flow

## Purpose

`Hedge Forecast` is a Peaks.Modern feature for creating a hedge profile from monthly forecast values.

The customer-facing profile uses Modern Projection terms:

```text
Modern Base MWh
Modern Peak MWh
```

Persistence remains canonical. Accepting a hedge writes canonical component transactions only.

## Input Fields

The user selects:

```text
start_month
end_month
percentage
```

The percentage scales both forecast modern values:

```text
hedge_modern_base_mwh = forecast_modern_base_mwh * percentage
hedge_modern_peak_mwh = forecast_modern_peak_mwh * percentage
```

## Editable Profile

The generated profile displays:

```text
Month
Forecast Base MWh
Forecast Peak MWh
Hedge %
Base MWh
Base MW
Peak MWh
Peak MW
Total MWh
```

The editable fields are:

```text
Base MWh
Peak MWh
```

`Peak MWh` may be negative. `Base MWh` must not be negative.

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

The accept flow must not persist these projected component names:

```text
modern.base.sys
modern.base.epad
modern.peak.sys
modern.peak.epad
```

Modern projected Data Viewer rows can still show `modern.*` rows after accept because those rows are derived from canonical transactions.

## Q-Factor Usage

For every transaction, `q_factor` is read from the selected portfolio's linked product component Q-factor structure:

```text
PortfolioProductComponent -> QFactorSet -> QFactorValue month
```

Allocation rows use q-factor `0`. Base rows use the base q-factor. Peak rows use the peak q-factor.
