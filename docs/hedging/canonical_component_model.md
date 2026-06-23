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
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

The canonical Peaks component set is `allocation.peak.sys`, `allocation.peak.epad`, `base.sys`, `base.epad`, `peak.sys` and `peak.epad`.

`allocation.peak.sys` and `allocation.peak.epad` are dimension-specific helper/allocation rows. They normally carry the same MW. They use `peak_h`, have price `0`, q-factor `0`, and do not create market quantity. They must not be summed as physical customer volume.

Classic/Legacy customer projections use one effective allocation peak MW as the peak-hour volume driver, but do not display allocation rows as customer rows. If split allocation rows differ, the projection warns and uses `allocation.peak.sys` as the customer volume carrier.

`base.sys` and `base.epad` carry the flat total monthly hedge:

```text
base_mw = forecast_mwh * hedge_pct / total_h
```

`peak.sys` and `peak.epad` carry the positive or negative canonical peak component relative to flat base:

```text
allocation_peak_mw = forecast_mwh * hedge_pct * peak_pct / peak_h
peak_mw = allocation_peak_mw - base_mw
```

`peak_mw` may be negative.

## Compatibility

Deprecated component aliases:

```text
allocation.peak -> allocation.peak.sys and allocation.peak.epad
peak.modern.sys -> peak.sys
peak.modern.epad -> peak.epad
peak.premium.sys -> peak.sys
peak.premium.epad -> peak.epad
```

New generated transactions use split `allocation.peak.*` and `peak.*` components.
