# Component model

The prototype describes hedge, risk and settlement behavior as a composition of reusable components rather than as hard-coded commercial products.

## Core terms

- `contract part`: a reusable configured part of an agreement model.
- `hedging window`: an aggregation scope for forecast-driven or pre-contract hedge decisions.
- `portfolio`: the operational/economic grouping used for position, netting and follow-up.
- `delivery month`: the settlement and delivery-period dimension used heavily in B2B portfolio products.
- `call-off`: a market-oriented request or allocation that can be transformed into market execution and settlement input.
- `customer transaction`: a customer-/settlement-facing transaction row derived from internal economic facts.
- `market component`: an executable or market-referenced component used in the market layer.
- `profile component`: a component that represents time-shape/profile risk rather than total monthly volume alone.
- `risk component`: a component/service that changes who bears a defined risk and may also alter settlement behavior.
- `settlement view`: the calculated perspective used for invoicing and customer-facing review.
- `business event`: an explicit event that creates or changes economic exposure.
- `residual settlement basis`: economic value that remains after an active component is removed or reversed.

## Current B2B component families

- Sys / EPAD base-price hedge;
- Profile Risk, with 15m Profile and Peak Profile as working variants;
- Volume Risk, including PF Flex- and PF Andel-like settlement patterns;
- Seasonality Financing / Flat Pricing;
- Virtual Product Structuring.

## Representation rule

A component does not need to use the same representation in all layers.

Example: 15m Profile can be:

- customer: full monthly volume × Q-term;
- internal: Profile Risk on a monthly volume with Q-factor and explicit economic attribution;
- market: extra `(Q-factor - 1) × volume` expressed in base-equivalent execution volume.

These are three views of the same underlying service, not three separate products.

## Component lifecycle rule

Components should support explicit lifecycle transitions:

- add;
- reconfigure;
- remove/reverse;
- preserve residual economics where required;
- project resulting settlement into customer-facing rows.

This lifecycle capability is central to product migration and portfolio follow-up.
