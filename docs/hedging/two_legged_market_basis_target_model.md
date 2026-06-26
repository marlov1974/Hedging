# Two-legged market basis target model

## Purpose

This document records the target model direction for the hedging PoC before implementation goes too far in the earlier component/projection model.

The model separates customer-facing commercial truth from market-facing hedge, risk and settlement truth.

The target model is deliberately row-based and normalized:

```text
few stable columns
many component rows
facts stored once where possible
projections/read models derived from canonical rows
```

## Core principle

A hedge event can have two canonical legs:

```text
Customer leg = commercial/product-facing customer transaction
Market leg   = market/risk/settlement transaction in the customer's portfolio
```

The legs are linked through event/calloff relationships and can have different component codes, quantities and prices.

Important correction: a customer leg is not required for every product. It is required when the customer-facing product basis differs from the market basis, or when commercial customer components such as fees/premiums must be represented.

## Product/basis roles

The target model has these roles:

```text
Market bases = canonical market/risk/settlement basis
Modern       = canonical customer basis for Peaks/Modern/Profile-like products
Classic      = projection from Modern customer basis
Baseloads    = market-near product, projected from Market canonical
```

Baseloads is a market-near product. By default, Baseloads hedge position exists in the market leg only:

```text
Baseloads hedge source of truth = market.base rows
Baseloads customer view/report  = projection from market.base rows
```

Baseloads may still have customer-leg details for commercial add-ons such as `fee.calloff`, but it normally does not need a separate customer hedge detail.

## Customer canonical model

Modern is the customer canonical basis when the customer product has a customer-side shape that differs from market basis.

Modern customer components include:

```text
modern.base
modern.peak
```

Classic is a customer projection from Modern. Classic is not source of truth.

Baseloads input is not normalized to `modern.base` by default. Baseloads is market-near, so a Baseloads hedge calloff creates market basis rows and, where applicable, customer add-on rows.

This avoids turning a Baseloads-to-Peaks upgrade into a false sale of `modern.base`. Instead, the upgrade is handled as linked market rebalance and customer conversion calloffs.

## Market canonical model

Market canonical basis is Market bases.

```text
market.base.<area-or-layer>
```

Market basis is the source of truth for market position, risk, settlement, netting and Baseloads reporting.

For pure Baseloads, the customer-facing hedge view and market base are effectively the same because Q = 1, but only the market leg needs to carry the hedge row.

For Peaks/Modern/Profile-like products, customer basis and market basis differ. Example:

```text
Customer: modern.peak +50 at 110
Q = 1.10
Market: market.base +55 at 100
```

The transformation preserves hedge value:

```text
customer_quantity * customer_price = market_quantity * market_price
```

For Q-factor conversion:

```text
market_quantity = customer_quantity * q_factor
market_price    = customer_price / q_factor
```

The Q-factor used must be stored on the event/detail when it is part of the decision. Historical rows must not be recalculated from the latest Q-factor.

## Projections

Reports/read models use different canonical sources:

```text
Modern view    = customer Modern canonical
Classic view   = projection from customer Modern canonical
Baseloads view = projection from Market canonical
Settlement     = Market canonical
```

Baseloads is therefore not a separate canonical customer hedge component model. It is a customer-facing view over market base exposure.

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

## Customer calloff patterns

### Baseloads calloff

A Baseloads hedge calloff is market-near.

Typical Baseloads hedge event:

```text
MARKET leg:
  market.base.sys / market.base.area

CUSTOMER leg:
  fee.calloff, if configured
  other customer add-ons only if explicitly configured
```

There is normally no Baseloads customer hedge detail. The Baseloads calloff list and position report project from the market leg.

### Peaks/Modern/Profile calloff

A Peaks/Modern/Profile-like calloff creates both legs:

```text
CUSTOMER leg:
  modern.base
  modern.peak
  fee.calloff
  premium.q_term
  premium.p_agent

MARKET leg:
  market.base rows derived from the customer hedge components
```

Market leg may be created milliseconds after customer leg, but both belong to the same business process and must be linkable.

## Commercial price components and add-ons

Commercial add-ons are configured as price components under product configuration and materialized as customer event details at calloff time.

Required PoC components:

```text
fee.calloff
premium.q_term
premium.p_agent
```

Rules:

- Add-ons are separate customer event details.
- Add-ons are not folded into hedge price.
- Add-ons normally do not create market legs.
- Prices remain per MWh, such as `SEK_PER_MWH`, `EUR_PER_MWH` or `LOCAL_CCY_PER_MWH`.
- Do not convert add-on prices to price per MW.
- Value is derived from volume and price per MWh.
- Store enough source/configuration information on the generated detail to explain which configured price was used at calloff time.
- Historical add-on details must not be recalculated from the latest product configuration.

### Fee

`fee.calloff` is a transaction activity fee.

Rules:

- Fee is always positive.
- Fee is created per calloff event where the fee applies.
- Fee volume is based on the absolute customer-facing calloff volume for that event.
- Buy and sell both generate positive fee volume.
- Fee is not calculated from net position.
- Fee is not calculated from market basis volume.
- Fee must not double-count SYS and EPAD/area if they are part of the same customer calloff and represent the same customer volume layer.
- Separate SYS and EPAD/area calloffs are charged separately.

Examples:

```text
Baseloads same calloff:
market.base.sys  +100 MWh
market.base.epad +100 MWh
fee.calloff      +100 MWh
```

```text
Baseloads two separate calloffs:
calloff 1: market.base.sys  +100 MWh -> fee.calloff +100 MWh
calloff 2: market.base.epad +100 MWh -> fee.calloff +100 MWh
Total fee volume = 200 MWh
```

```text
Modern/Peaks buy:
modern.base +60 MWh
modern.peak +40 MWh
fee.calloff +100 MWh
```

```text
Modern/Peaks sell:
modern.base -30 MWh
modern.peak -20 MWh
fee.calloff +50 MWh
```

### Q-term

`premium.q_term` follows `modern.peak`.

Rules:

- Q-term volume equals signed `modern.peak` volume.
- Buying peak creates positive Q-term.
- Selling peak creates negative Q-term.
- Q-term is separate from Q-factor transformation.
- Q-term is a commercial customer premium, not a market basis factor.

### P-agent

`premium.p_agent` is simplified in the PoC.

Real-world direction:

```text
p-agent may be derived from virtual derivative volumes
```

PoC rule:

```text
premium.p_agent follows modern.peak, same volume logic as premium.q_term
```

Rules:

- P-agent volume equals signed `modern.peak` volume in the PoC.
- Buying peak creates positive P-agent.
- Selling peak creates negative P-agent.
- P-agent is a customer commercial premium, not a market leg.

## Rebalance/product change

Product change must not rewrite historical events.

Upgrade/downgrade creates rebalance/conversion events.

Core market rule:

```text
new_target_market_position - current_open_market_position = market_delta_to_trade
```

Markets trades only the delta.

Downgrade to Baseloads projects the current open market basis position into a customer-facing Baseloads position.

A downgrade does not reset the hedge to a clean Baseloads product. It converts the current open market basis position into a Baseloads-facing customer position unless explicitly waived.

## Baseloads to Peaks/Modern upgrade

Baseloads-to-Peaks/Modern upgrade must be two linked calloffs:

```text
1. MARKET_REBALANCE_CALLOFF
2. CUSTOMER_CONVERSION_CALLOFF
```

The purpose is to avoid mixing market delta trading with customer product conversion.

### Market rebalance calloff

Purpose:

```text
trade market.base delta so the market position reaches the target required by the upgraded product
```

Input includes:

```text
period
price_area
target_percentage_of_forecast
target customer product = Peaks/Modern
SYS and EPAD/area dimension
```

Rules:

1. Calculate target Modern customer shape from the forecast percentage.
2. Convert target Modern shape to target market base using Q-factors.
3. Compare target market base with current open market base.
4. Trade only the market delta.
5. Create market leg details.
6. Do not create final Modern customer hedge details in this calloff.

### Customer conversion calloff

Purpose:

```text
create Modern customer components from the resulting open market position after market rebalance
```

Rules:

1. Run after the market rebalance calloff.
2. Read the resulting open market base position.
3. Calculate effective market base price as value divided by volume.
4. Derive Modern customer component prices from the open market position.
5. Do not use the price API for customer hedge component prices.
6. Create customer Modern components and customer add-ons.
7. Do not trade additional market delta.

The conversion preserves value between the open market position and the new customer Modern components, subject to rounding.

## SYS and EPAD/area separation

SYS and EPAD/area must remain separate throughout market rebalance and customer conversion.

Do not blend SYS and EPAD/area value, volume or effective price.

Required separation:

```text
SYS:
current open market base sys
target market base sys
delta sys
effective sys price
derived customer sys components

EPAD/area:
current open market base area
target market base area
delta area
effective area price
derived customer area components
```

The same rule applies to reports, conversion pricing and audit explanations.

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
source_price_component_id
source_price
source_price_type
```

Avoid storing the same fact twice. Store historical decision values on the event detail when they were part of the decision, for example `q_factor_used` or configured add-on price used.

## Terms

```text
Customer leg: customer/product-facing transaction leg, used when product basis or customer add-ons must be represented
Market leg: market/risk/settlement canonical transaction leg
Modern: canonical customer basis for Peaks/Modern/Profile-like products
Classic: customer projection from Modern
Market bases: canonical market basis
Baseloads: market-near product; hedge view projected from Market canonical
Market-near Baseloads: Baseloads projection that can be shown as clean market-near base rows
Profiled Baseloads: Baseloads projection with period-specific/profiled volumes
Market-only adjustment: market leg without customer leg, typically due to Q/profile update
Market rebalance calloff: calloff that trades market delta to target
Customer conversion calloff: calloff that creates customer product components from resulting open market position
Fee: always-positive customer transaction activity component
Q-term: signed customer premium following modern.peak
P-agent: PoC signed customer premium following modern.peak
```
