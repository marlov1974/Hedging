# Portfolio Hedging Products

## Product Family

The PoC product family is:

```text
Portfolio Hedging Products
```

It contains portfolio-level hedging product packages for customer forecast, calloff, position and settlement workflows.

## Product Packages

Current PoC package names are:

```text
Baseloads
Peaks.Classic
Peaks.Modern
Profiles.Classic
Profiles.Modern
```

`PeaksModern`, `PeaksClassic`, `ProfilesModern` and `ProfilesClassic` are deprecated aliases kept only for compatibility with earlier package history.

## Model Layers

```text
product package = commercial/service package selected by the portfolio
feature set = customer-facing workflow for that package
projection = presentation of canonical component rows
canonical model = shared internal component transaction model
```

Peaks.Classic and Peaks.Modern can map to the same canonical component positions while still presenting different customer experiences.
