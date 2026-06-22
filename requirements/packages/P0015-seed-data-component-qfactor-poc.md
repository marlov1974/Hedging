# P0015 - Seed data for component and Q-factor PoC

## Purpose

Create deterministic seed data for the component-based product structure PoC.

This package creates five customers, five portfolios, five product configurations, Swedish trading calendar data, customer forecasts, portfolio component instances, Q-factor sets and monthly Q-factor values.

This is a coding package.

## Scope

Seed data period:

```text
2027-01 through 2029-12
```

That means 36 monthly rows for calendar, forecasts and Q-factor values.

## Product configurations

Create five product configurations:

```text
Baseloads
PeaksClassic
PeaksModern
ProfilesClassic
ProfilesModern
```

## Customers and portfolios

Create one customer and one portfolio per product configuration:

```text
CUST_BASELOADS         -> PORT_BASELOADS         -> Baseloads
CUST_PEAKS_CLASSIC     -> PORT_PEAKS_CLASSIC     -> PeaksClassic
CUST_PEAKS_MODERN      -> PORT_PEAKS_MODERN      -> PeaksModern
CUST_PROFILES_CLASSIC  -> PORT_PROFILES_CLASSIC  -> ProfilesClassic
CUST_PROFILES_MODERN   -> PORT_PROFILES_MODERN   -> ProfilesModern
```

Use price area:

```text
SE3
```

Use calendar:

```text
CAL_SE_TRADING
```

## Swedish trading calendar

Create calendar rows for every month from 2027-01 through 2029-12.

Definition:

```text
peak = weekdays 06:00-22:00
offpeak = all other hours
```

For each month:

```text
total_h = days_in_month * 24
peak_h = weekdays_in_month * 16
offpeak_h = total_h - peak_h
```

If the existing Calendar table does not have `offpeak_h`, derive it in code/tests rather than changing schema unless required by existing patterns.

## Component vocabulary

Use this component vocabulary for the PoC:

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

## Product components

### Baseloads

```text
base.sys
base.epad
```

### PeaksClassic

```text
base.classic.sys
base.classic.epad
peak.classic.sys
peak.classic.epad
```

### PeaksModern

```text
base.sys
base.epad
peak.modern.sys
peak.modern.epad
```

### ProfilesClassic

```text
base.classic.sys
base.classic.epad
peak.classic.sys
peak.classic.epad
profile.sys
profile.epad
volume
```

### ProfilesModern

```text
base.sys
base.epad
peak.modern.sys
peak.modern.epad
profile.sys
profile.epad
volume
```

## Component semantics

The component code defines behavior. Do not overload one component code with two incompatible meanings.

### Total-consumption base

```text
base.sys
base.epad
```

These represent total customer consumption.

### Classic timeblock components

```text
base.classic.sys
base.classic.epad
peak.classic.sys
peak.classic.epad
```

These support the classic timeblock / energy-partition model.

### Modern exposure components

```text
peak.modern.sys
peak.modern.epad
profile.sys
profile.epad
volume
```

These support the modern total-consumption plus exposure/risk-layer model.

## Portfolio product component instances

Add a portfolio-component instance table if it does not already exist:

```text
PortfolioProductComponent
- portfolio_productcomponent_id
- portfolio_id
- productcomponent_id
- qfactor_set_id
```

Purpose:

```text
ProductConfigurationComponent = product definition
PortfolioProductComponent = customer/portfolio-specific component instance
```

A portfolio product component points to a Q-factor set.

## Q-factor tables

Add Q-factor tables if they do not already exist.

### QFactorSet

```text
qfactor_set_id
name
component
description
```

Rules:

- `component` uses the same component vocabulary as Product Configuration Component.
- `component` should match the linked Product Configuration Component component.

### QFactorValue

```text
qfactor_value_id
qfactor_set_id
month
value
```

Rules:

- `month` uses `YYYY-MM`.
- Logical uniqueness: `(qfactor_set_id, month)`.
- One value per month.

## Q-factor value ranges

Create a Q-factor set for every portfolio product component instance, including components with constant Q-factor values.

Use these deterministic ranges by component family:

```text
base.sys / base.epad = 1.0
base.classic.sys / base.classic.epad = 1.0
peak.modern.sys / peak.modern.epad = 1.2-1.5
peak.classic.sys / peak.classic.epad = 2.2-2.5
profile.sys / profile.epad = 1.03-1.09
volume = 0
```

The values may vary slightly by month inside the allowed interval, but must be deterministic.

## Forecasts

Create 36 monthly forecast rows per portfolio.

Forecast fields:

```text
portfolio_id
month
mwh
peak_pct
```

Rules:

- `mwh` is total customer consumption forecast.
- `peak_pct` is profile information, not necessarily energy ownership by a peak component.
- Use deterministic synthetic values.
- Ensure all portfolios have complete 2027-01 through 2029-12 data.

Suggested profile differences:

```text
Baseloads: stable volume, moderate peak_pct
PeaksClassic: more peak-heavy profile
PeaksModern: more peak-heavy profile
ProfilesClassic: more shaped/profiled volume
ProfilesModern: more shaped/profiled volume
```

## Price components

Create price components for all product configuration components using deterministic synthetic prices.

Suggested values:

```text
base.sys = 80 EUR/MWh
base.epad = 5 EUR/MWh
base.classic.sys = 80 EUR/MWh
base.classic.epad = 5 EUR/MWh
peak.classic.sys = 20 EUR/MWh
peak.classic.epad = 3 EUR/MWh
peak.modern.sys = 12 EUR/MWh
peak.modern.epad = 2 EUR/MWh
profile.sys = 7 EUR/MWh
profile.epad = 2 EUR/MWh
volume = 4 EUR/MWh
```

Use existing Price Component table conventions.

## Required implementation

Create or update seed modules and repository helpers using existing patterns.

Suggested files, adapt to existing conventions:

```text
src/database/seedPocData.ts
src/database/qFactors.ts
src/database/portfolioProductComponents.ts
tests/database/pocSeedData.test.ts
docs/data-model/poc_seed_data.md
```

## Required tests

Add tests for:

1. five customers exist,
2. five portfolios exist,
3. five product configurations exist,
4. all expected product components exist for each product configuration,
5. calendar has 36 rows for 2027-01 through 2029-12,
6. calendar peak hours follow weekdays 06:00-22:00,
7. each portfolio has 36 forecast rows,
8. forecast mwh represents total customer consumption,
9. each portfolio product component has one qfactor_set_id,
10. each qfactor set has 36 monthly values,
11. qfactor set component matches linked product component component,
12. qfactor values stay inside the allowed ranges,
13. base components have Q-factor 1.0,
14. volume components have Q-factor 0,
15. product and qfactor structures distinguish classic and modern peak components.

## Documentation

Create:

```text
docs/data-model/poc_seed_data.md
```

Document:

```text
five-customer/five-product setup
calendar generation rule
forecast period
component vocabulary
classic vs modern component families
PortfolioProductComponent purpose
QFactorSet and QFactorValue model
qfactor ranges by component family
```

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

Update `REPOSITORY_FILES.md` to match `git ls-files`.

## Completion report

Report:

- files changed,
- schema changes,
- seed data counts,
- qfactor model implemented,
- tests added,
- tests run,
- test result,
- REPOSITORY_FILES.md status.
