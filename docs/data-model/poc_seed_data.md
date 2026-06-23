# PoC seed data

P0015 creates deterministic PoC seed data for component-based product structure testing.

## Setup

The seed contains five customers, five portfolios and five product configurations:

```text
CUS00         -> CUS00-0         -> Baseloads
CUS01         -> CUS01-0         -> Peaks.Classic
CUS02         -> CUS02-0         -> Peaks.Modern
CUS03         -> CUS03-0         -> Profiles.Classic
CUS04         -> CUS04-0         -> Profiles.Modern
```

All examples are public-safe PoC examples. Price area is `SE3`.

Seed IDs use compact demo-friendly formats:

```text
customer_number: CUS00
portfolio_id: CUS00-0
product_id: PRO00
productcomponent_id: PRO00:base.sys
forecast_id: FOR00-00
qfactor_set_id: Q00
qfactor_value_id: Q00-00
```

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

Forecast rows use a deterministic small-industry seasonal profile:

```text
mwh is around 1000 with about +/-250 variation
winter consumption is higher because the customer has own heating
summer vacation and Christmas consumption are lower
peak_pct is around 50%
summer half peak_pct is higher outside vacation
vacation peak_pct is medium
winter peak_pct is medium
Christmas peak_pct is low
```

## Component Vocabulary

The PoC uses:

```text
base.sys
base.epad
base.classic.sys
base.classic.epad
allocation.peak
peak.classic.sys
peak.classic.epad
peak.premium.sys
peak.premium.epad
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
allocation.peak
base.sys
base.epad
peak.premium.sys
peak.premium.epad
profile.sys
profile.epad
volume
```

Deprecated aliases are accepted only for compatibility:

```text
PeaksModern -> Peaks.Modern
PeaksClassic -> Peaks.Classic
peak.modern.sys -> peak.premium.sys
peak.modern.epad -> peak.premium.epad
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
allocation.peak = 0
peak.premium.sys / peak.premium.epad = 1.2-1.5
peak.classic.sys / peak.classic.epad = 2.2-2.5
profile.sys / profile.epad = 1.03-1.09
volume = 0
```

The values are seed inputs for later Market derivation work. P0015 does not create call-offs, transactions or derived Market rows.
