# P0050 - Baseloads from market canonical

## Purpose

Make Baseloads a customer-facing projection from the market canonical model.

Baseloads is not a separate canonical customer component model.

## Requirements

1. Baseloads report/projection reads market base rows.
2. Baseloads projection aggregates signed market base quantity and value.
3. Price is derived last.

Projection rule:

```text
volume = sum(signed market_base quantity)
value = sum(signed market_base quantity * market_base price)
price = value / volume
```

4. Baseloads projection can produce two shapes:

```text
MARKET_NEAR_BASELOADS
PROFILED_BASELOADS
```

5. If volumes differ across months because of downgrade/rebalance history, show profiled Baseloads rather than pretending it is a clean market-near Baseloads calloff.
6. Baseloads entries still normalize to Modern customer basis and market base as defined in earlier packages.

## Tests

Cover:

1. Baseloads report reads market basis rows.
2. Aggregated price is value divided by volume.
3. Signed market base rows compress correctly.
4. Profiled Baseloads can be identified when period volumes differ.
5. Baseloads report does not read old Peak-volume special logic as source of truth.

## Non-goals

Do not implement full product migration/rebalance in this package.

## Verification

Run npm test, git status --short and git diff --check. Update REPOSITORY_FILES.md if tracked files change.
