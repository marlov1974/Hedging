# P0047 - Two-legged transaction model

## Purpose

Introduce the foundation for the new canonical model: events can have a customer leg and a market leg.

This is the first implementation package in the target-model refactor.

## Read first

Codex must read:

```text
docs/hedging/two_legged_market_basis_target_model.md
requirements/packages/P0047-two-legged-transaction-model.md
requirements/packages/P0048-modern-customer-canonical.md
requirements/packages/P0049-market-bases-canonical.md
requirements/packages/P0050-baseloads-from-market-canonical.md
requirements/packages/P0051-rebalance-product-migration.md
requirements/packages/P0052-market-only-q-profile-adjustments.md
requirements/packages/P0053-projection-read-model-cleanup.md
requirements/packages/P0054-legacy-compatibility-cleanup.md
```

Then implement P0047 only.

## Requirements

1. Extend the event/detail model so an event detail can belong to a leg.
2. Supported leg types:

```text
CUSTOMER
MARKET
```

3. A normal hedge/calloff event may have both customer and market legs.
4. Customer and market legs may have different component codes, quantities and prices.
5. Legs must be linkable through event id and/or explicit linked detail id.
6. Existing transaction/calloff names may remain as compatibility names, but the conceptual model should be event plus legged event details.
7. Signed quantities remain required.
8. Do not overwrite old rows to represent a new market position.
9. Add type definitions and validation where useful.
10. Preserve existing behavior through compatibility wrappers where needed.

## Initial fields

Use real columns/typed fields where possible, not arbitrary key/value attributes:

```text
event_id
leg_type
basis_type
component_code
period
price_area
quantity
quantity_type
price
price_type
factor
factor_type
reason
linked_detail_id
```

Not every field must be implemented immediately if existing structure cannot support it yet. P0047 should establish the leg concept and safe compatibility path.

## Tests

Add or update tests for:

1. event details can be customer legs.
2. event details can be market legs.
3. one event can contain both leg types.
4. customer and market legs can differ in component, quantity and price.
5. signed quantities still work.
6. existing tests still pass or are deliberately updated.

## Non-goals

Do not fully implement Modern canonical, market bases, Baseloads projection, rebalance, or Q/profile market-only adjustments in this package. Those are later packages.

## Verification

Run npm test, git status --short and git diff --check. Update REPOSITORY_FILES.md if tracked files change.
