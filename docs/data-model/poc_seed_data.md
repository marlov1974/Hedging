# PoC seed data

P0015 creates deterministic, synthetic seed data for component-based product structure testing.

## Setup

The seed contains five customers, five portfolios and five product configurations:

```text
CUST_BASELOADS         -> PORT_BASELOADS         -> Baseloads
CUST_PEAKS_CLASSIC     -> PORT_PEAKS_CLASSIC     -> PeaksClassic
CUST_PEAKS_MODERN      -> PORT_PEAKS_MODERN      -> PeaksModern
CUST_PROFILES_CLASSIC  -> PORT_PROFILES_CLASSIC  -> ProfilesClassic
CUST_PROFILES_MODERN   -> PORT_PROFILES_MODERN   -> ProfilesModern
```

All examples are synthetic. Price area is `SE3`.

## Calendar

The seed period is:

```text
2027-01 through 2029-12
```

The Swedish trading calendar is represented by monthly rows using technical ids derived from the calendar set:

```text
CAL_SE_TRADING:YYYY-MM
```

Portfolio rows reference the calendar set id:

```text
CAL_SE_TRADING
```

Peak hours use weekdays 06:00-22:00:

```text
total_h = days_in_month * 24
peak_h = weekdays_in_month * 16
offpeak_h = total_h - peak_h
```

`offpeak_h` is derived by code and tests because the current `Calendar` table stores only `total_h` and `peak_h`.

## Forecasts

Each portfolio has 36 monthly forecast rows. Forecast `mwh` represents total customer consumption. `peak_pct` is profile information and is not treated as energy ownership by a peak component.

## Component Vocabulary

The PoC uses:

```text
base.sys
base.epad
base.classic.sys
base.classic.epad
peak.classic.sys
peak.classic.epad
peak.modern.sys
peak.modern.epad
profile.sys
profile.epad
volume
```

## Classic and Modern Families

Classic peak structures use explicit timeblock/energy-partition components:

```text
base.classic.sys
base.classic.epad
peak.classic.sys
peak.classic.epad
```

Modern structures use total-consumption base components and separate exposure/risk layers:

```text
base.sys
base.epad
peak.modern.sys
peak.modern.epad
profile.sys
profile.epad
volume
```

## PortfolioProductComponent

`PortfolioProductComponent` is the portfolio-specific instance of a configured product component.

It links:

```text
portfolio_id
productcomponent_id
qfactor_set_id
```

`ProductConfigurationComponent` defines the product. `PortfolioProductComponent` identifies the customer/portfolio-specific component instance and the Q-factor set used for that instance.

## QFactorSet and QFactorValue

`QFactorSet` stores the component-level Q-factor grouping:

```text
qfactor_set_id
name
component
description
```

`QFactorValue` stores monthly values:

```text
qfactor_value_id
qfactor_set_id
month
value
```

There is one Q-factor set per portfolio product component and one Q-factor value per set and month.

## Q-factor Ranges

Deterministic values stay inside these ranges:

```text
base.sys / base.epad = 1.0
base.classic.sys / base.classic.epad = 1.0
peak.modern.sys / peak.modern.epad = 1.2-1.5
peak.classic.sys / peak.classic.epad = 2.2-2.5
profile.sys / profile.epad = 1.03-1.09
volume = 0
```

The values are seed inputs for later Market derivation work. P0015 does not create call-offs, transactions or derived Market rows.
