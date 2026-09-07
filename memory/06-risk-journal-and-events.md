# Risk, journal and event model

This file preserves the broader risk/accounting design explored before the current B2B component work. It is relevant because product components, execution and settlement must eventually coexist with durable attribution of economic outcomes.

## Core journal idea

A useful mental model is ERP-like:

- **Event** = what happened;
- **Dimensions** = what the event belongs to;
- **Accounts / economic roles** = what type of value or risk movement it represents.

The aim is not necessarily to force the entire implementation into a literal accounting journal, but to preserve the discipline of explicit events, immutable economic facts and multi-dimensional attribution.

Important dimensions discussed:

- Contract;
- Hedging Window;
- Portfolio;
- Delivery Month.

Potential event types include:

- OfferAccepted;
- RegretPassed / cooling-off completed;
- Churn-related events;
- AnnualVolumeForecastChanged;
- QFactorChanged;
- ActualVolumeDeviation;
- contract-start and contract-change events.

## Attribution principle

Risk attribution should follow the **causing event**, not the execution shape.

Example: an `AnnualVolumeForecastChanged` event may require both a base hedge and an additional profile hedge. Even though execution is split into two market components, both economic effects belong to Volume Risk if the volume-forecast change caused them.

Likewise, a `QFactorChanged` event should be attributed to Profile Risk even if execution uses base-equivalent blocks.

This avoids the common error of equating "what instrument was traded" with "what business risk caused the trade".

## Offer risk

Offer risk is price risk between the accepted customer price and the actual post-contract hedge.

Baseline mitigation:

- hedge as soon as possible after accepted contract / relevant commitment point.

A pre-contract hedge may be used at Hedging Window level based on expected sales. Its purpose is primarily **volatility reduction**, not increasing expected gross margin.

Pre-contract contribution can be measured against a post-contract-only baseline at aggregate hedging-window level. It should not be artificially allocated to individual contracts unless a robust method exists.

Profile exposure contributes to offer risk when the full hedge requirement includes both base and profile uplift. Example: 100 MWh with Q-factor 1.10 implies 100 MWh base plus 10 MWh profile-equivalent exposure. A price movement therefore affects the full equivalent hedge requirement.

Volume Risk itself does **not** create offer risk; volume-related later adjustments belong to Volume Risk or another explicitly caused risk category.

## Churn and contract-event risk

Earlier work distinguished several churn/event families such as regret/cooling-off, death, insolvency and move. These are useful examples of why business events should remain explicit even if several events ultimately cause similar market actions.

The long-term model should be able to calculate economic outcome by:

- customer/contract;
- risk family;
- event type;
- delivery period;
- portfolio/hedging window;
- market execution component.

Those views should be derivable from the same event/economic facts rather than maintained as parallel bespoke calculations.

## Netting and market execution

Internal component needs should be aggregatable/nettable before orders are sent to market or a market-access party. This reduces unnecessary spread and prevents customer-level transaction structure from forcing inefficient market execution.

Therefore:

- customer transaction != market order;
- internal risk attribution != market instrument;
- market execution can be netted while attribution remains detailed internally.
