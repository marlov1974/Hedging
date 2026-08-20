# Legacy compatibility

## Purpose

P0054 keeps the target model clear while documenting the compatibility surface that remains for older fixtures, tests and transitional UI paths.

Compatibility code is not a second canonical model. It is a read/adapter layer around older rows until those rows are no longer needed.

## Deprecated component aliases

These component names are deprecated read-compatible aliases:

```text
allocation.peak
peak.premium.sys
peak.premium.epad
peak.modern.sys
peak.modern.epad
```

They may be read by compatibility projections for older fixtures. New seed product configuration rows should not store these names.

Target component names are:

```text
allocation.peak.sys
allocation.peak.epad
peak.sys
peak.epad
```

## Deprecated product package aliases

These package names are deprecated aliases:

```text
PeaksClassic -> Peaks.Classic
PeaksModern  -> Peaks.Modern
```

They remain accepted for old references and tests. New configuration should use the dotted names.

## Old projected transaction paths

These Data Viewer table ids remain callable as compatibility/debug tables:

```text
classic-projected-transactions
modern-projected-transactions
```

They are derived from compatibility transaction rows and should not be treated as canonical storage.

The normal target-model Data Viewer path is:

```text
customer-legs
market-legs
modern-customer-canonical
classic-customer-projection
baseloads-projected-transactions
market-basis-position
```

## Report source order

Reports use target-model read sources first:

```text
Modern report    -> Modern customer canonical event details
Classic report   -> Classic projection from Modern customer canonical event details
Baseloads report -> Market basis event details
Settlement       -> Market basis event details
```

Compatibility fallbacks remain only for older data that does not yet write two-legged event details.

## Seed data policy

New seed product configuration rows should avoid deprecated aliases. Seed forecasts are mirrored as canonical `FORECAST` events with price-area details. Purchase and rebalance flows create two-legged event details while retaining compatibility transaction rows for existing UI flows.
