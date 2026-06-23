# P0021 addendum - Product-specific application appearance

## Purpose

Clarify that portfolio selection changes both available features and the application appearance.

## Requirement

When the user selects a portfolio, the app should resolve the portfolio's product/application configuration and apply the matching application shell.

This affects:

```text
available features
feature labels
active feature reset behavior
visible page/context title if any
copy/text tone
layout emphasis
```

## Rule

The selected portfolio's product configuration determines the application variant.

At minimum:

```text
Baseloads portfolio -> Baseloads application appearance and feature set
PeaksModern portfolio -> PeaksModern application appearance and feature set
```

## PeaksModern

When a PeaksModern portfolio is selected:

```text
show PeaksModern application appearance
show Portfolio Details
show Forecast
hide Baseloads-specific features
```

## Baseloads

When a Baseloads portfolio is selected:

```text
show Baseloads application appearance
show Baseloads feature set
hide PeaksModern-specific Forecast feature unless it is later made shared
```

## Tests

Add or update tests so that changing selected portfolio changes:

```text
application variant
available feature list
active feature if the old active feature is no longer valid
visible application context text if implemented
```
