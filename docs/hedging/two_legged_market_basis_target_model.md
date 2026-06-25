# Two-legged market basis target model

## Purpose

This document records the target model direction for the hedging PoC before implementation goes too far in the earlier component/projection model.

The model separates customer-facing commercial truth from market-facing hedge and settlement truth.

## Core principle

A hedge event may have two canonical legs:

```text
Customer leg = commercial/product-facing customer transaction
Market leg   = market/risk/settlement transaction in the customer's portfolio
```

The legs are linked through the same event/calloff and can have different component codes, quantities and prices.

## Customer canonical model

Customer canonical basis is Modern.

```text
modern.base
modern.peak
```

Classic is a customer projection from Modern. Classic is not source of truth.

Baseloads input is normalized into Modern customer basis with:

```text
modern.base = input base
modern.peak = 0
```

## Market canonical model

Market canonical basis is Market bases.

```text
market.base.<area>
```

Market basis is the source of truth for market position, risk, settlement, netting and Baseloads reporting.

For pure Baseloads, customer base and market base are the same because Q = 1.

For Peaks or Profiles, customer basis and market basis differ. Example:

```text
Customer: modern.peak +50 at 110
Q = 1.10
Market: market.base +55 at 100
```

The transformation preserves hedge value:

```text
customer_quantity * customer_price = market_quantity * market_price
```

## Projections

Reports/read models use different canonical sources:

```text
Modern view    = customer Modern canonical
Classic view   = projection from customer Modern canonical
Baseloads view = projection from Market canonical
Settlement     = Market canonical
```

Baseloads is therefore not a separate canonical customer component model. It is a customer-facing view over market base exposure.

## Baseloads projection

Baseloads projection reads signed market base rows:

```text
volume = sum(signed market_base quantity)
value  = sum(signed market_base quantity * market_base price)
price  = value / volume
```

Price is derived last.

The projection may produce either:

```text
MARKET_NEAR_BASELOADS
PROFILED_BASELOADS
```

Downgrades can result in profiled Baseloads rows because open market base volumes may differ by month. Those must not be presented as clean market-near Baseloads calloffs if the shape is profiled.

## Customer calloff

A normal customer calloff creates both legs:

```text
Customer leg: what the customer bought/sold commercially
Market leg: what Markets hedged as market basis
```

Market leg may be created milliseconds after customer leg, but both belong to the same business event.

## Rebalance/product change

Product change must not rewrite historical events.

Upgrade/downgrade creates a rebalance event:

```text
new_target_market_position - current_open_market_position = market_delta_to_trade
```

Markets trades only the delta.

Downgrade to Baseloads projects the current open market basis position into a customer-facing Baseloads position.

A downgrade does not reset the hedge to a clean Baseloads product. It converts the current open market basis position into a Baseloads-facing customer position unless explicitly waived.

## Market-only adjustments

If Q-factor or profile-factor changes while the customer remains on Peaks/Profiles, no new customer leg is created.

Instead, create a market-leg-only adjustment:

```text
reason = Q_FACTOR_UPDATE or PROFILE_FACTOR_UPDATE
customer leg = none
market leg = delta needed to align current market basis with the new factor
```

The customer commercial transaction is unchanged.

Likely default policy: open market-only adjustments are included if the customer later downgrades to Baseloads. Rationale: the customer leaves a higher-margin product where profile risk was handled by the supplier and moves to a lower-margin product. Open profile/market-basis risk should normally follow into the downgrade unless explicitly waived.

## Data model direction

Prefer one generic event detail model with leg fields rather than separate wide tables.

Core fields should remain real columns, not key/value attributes:

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

Avoid storing the same fact twice. Store historical decision values on the event detail when they were part of the decision, for example `q_factor_used`.

## Terms

```text
Customer leg: customer/product-facing canonical transaction leg
Market leg: market/risk/settlement canonical transaction leg
Modern: canonical customer basis
Classic: customer projection from Modern
Market bases: canonical market basis
Baseloads: projection from Market canonical
Market-only adjustment: market leg without customer leg, typically due to Q/profile update
Rebalance: event that trades market delta toward a target position
```
