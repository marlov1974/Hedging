# P0051 - Rebalance and product migration

## Purpose

Represent product changes as rebalance events.

## Requirements

1. Product changes must not modify historical events.
2. Product change creates a new rebalance event.
3. Rebalance calculates a target market position.
4. Rebalance compares the target with the current open market position.
5. Markets trades only the difference.

Rule:

```text
market_delta = target_market_position - current_open_market_position
```

6. Rebalance may create customer-leg changes, market-leg changes, or both.
7. Downgrade to Baseloads uses current open market basis for the new Baseloads-facing position unless explicitly waived.
8. The downgrade does not create a clean reset by default.
9. Generated row names are assigned at rebalance time.

## Tests

Cover:

1. Historical rows remain unchanged.
2. Rebalance creates only the needed market difference.
3. Upgrade/downgrade can be represented as rebalance.
4. Downgrade can use current open market basis.
5. Generated row names are assigned at rebalance time.

## Non-goals

Q/profile factor updates are handled later.

## Verification

Run npm test, git status --short and git diff --check. Update REPOSITORY_FILES.md if tracked files change.
