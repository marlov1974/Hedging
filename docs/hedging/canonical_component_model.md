# Canonical Component Model

## Rule

Component transactions are stored in MW.

MWh is a projection:

```text
component_mwh = component_mw * relevant_hours
```

`relevant_hours` comes from the component hour basis and monthly calendar.

## Peaks Components

```text
allocation.peak
base.sys
base.epad
peak.premium.sys
peak.premium.epad
```

`allocation.peak` is a helper component. It stores the customer's forecast peak-hour effect in MW, uses `peak_h`, has price `0`, q-factor `0`, and does not create market quantity.

`base.sys` and `base.epad` carry the flat total monthly hedge:

```text
base_mw = forecast_mwh * hedge_pct / total_h
```

`peak.premium.sys` and `peak.premium.epad` carry the positive or negative peak shape above flat base:

```text
allocation_peak_mw = forecast_mwh * hedge_pct * peak_pct / peak_h
peak_premium_mw = allocation_peak_mw - base_mw
```

`peak_premium_mw` may be negative.

## Compatibility

Deprecated component aliases:

```text
peak.modern.sys -> peak.premium.sys
peak.modern.epad -> peak.premium.epad
```

New generated transactions use `peak.premium.*`.
