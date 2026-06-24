# Peaks.Classic Hedge Forecast Flow

## Purpose

`Hedge Forecast` supports a Peaks.Classic customer perspective for creating a hedge profile from monthly forecast values.

For portfolio currency and `currency.eursek` semantics, see [Currency Component Model](currency_component_model.md).
For purchase events and event details, see [Event Detail Model](event_detail_model.md).

The customer-facing profile uses Peak/Offpeak terms:

```text
Offpeak MWh
Peak MWh
```

Persistence remains canonical. Accepting a hedge writes canonical component transactions only.
P0044 also mirrors the accepted hedge as a `PURCHASE` event with event details.

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

P0041 also adds model-level explicit purchase helpers for Classic inputs:

```text
offpeak_mwh
peak_mwh
offpeak_price_eur_per_mwh
peak_price_eur_per_mwh
fx_rate when portfolio currency is SEK
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

For SEK portfolios, explicit purchase helpers also add a `currency.eursek` transaction carrying EUR quantity and SEK_PER_EUR rate.

The accept flow must not persist projected `classic.*` components.

Classic and Modern projected rows can still be shown after accept because those rows are derived from canonical transactions.

SYS purchase event details are split by supported price area. Area-side purchase details use explicit area components such as `base.sto` and `peak.sto`.

## Q-Factor Usage

For every transaction, `q_factor` is read from the selected portfolio's linked product component Q-factor structure:

```text
PortfolioProductComponent -> QFactorSet -> QFactorValue month
```

Allocation rows use q-factor `0`. Base rows use the base q-factor. Peak rows use the peak q-factor.
