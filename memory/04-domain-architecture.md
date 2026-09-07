# Domain architecture baseline

This repository is intended to preserve a durable design baseline for a component-based hedging, risk and settlement model. The goal is not to reproduce a legacy application. The goal is to model the underlying economics and operational needs cleanly enough that several technical and customer representations can be derived from the same internal truth.

## Three representation layers

The solution must explicitly separate three layers:

1. **Market representation** — what is actually sent to a trading/market-access party or market. This may use exchange-like blocks, base/peak structures, synthetic products or other executable forms.
2. **Internal representation** — the canonical operational/economic model used for portfolio management, risk follow-up, product migration, pricing, settlement, invoicing, auditability and lifecycle management.
3. **Customer representation** — what the customer sees in offers, transaction lists, reports and invoices. This can deliberately differ from the market representation if an explicit, stable translation exists.

The internal model is the conceptual core. Market and customer forms are projections or translations, not constraints that should distort the internal model.

## Why this separation matters

The same economic exposure may have very different forms in each layer. Example: a 15-minute profile-risk hedge can internally be represented as a profile-risk component on a monthly volume, executed externally as extra base-equivalent hedge volume, and shown to the customer as the full monthly volume multiplied by a profile premium.

This separation is a deliberate design principle, not a temporary workaround.

## Legacy evolution context

The design has evolved through three conceptual generations:

- **Energy Site**: customer-facing and strongly shaped by legacy customer reporting. Product components were largely represented as columns on call-offs and monthly transaction details. Offpeak/Peak terminology was prominent because this matched customer views, while market execution could still use Base/Peak.
- **TBO**: introduced a more component-oriented, trading-oriented contract model, clearer Sys/EPAD separation and more flexible internal structures.
- **Order Service**: target direction. It must support a business that increasingly owns profile and volume risk itself rather than mirroring one external transaction per customer transaction. It therefore needs a richer internal economic model and looser coupling between customer representation and market execution.

The target model should preserve the ability to project into legacy-style reports during transition, but should not preserve legacy structural constraints indefinitely.

## Component-based product philosophy

Commercial products should be assembled from reusable components rather than hard-coded as isolated bundles. This has four important goals:

- create intermediate products by combining existing components differently;
- make new mature products cheap to launch when only a small new component or variant is needed;
- let customers migrate between products by adding/removing components and trading into a new balance instead of replacing the entire model;
- make economically unusual customers become normal customers with unusual component combinations, improving follow-up and automation.

Commercial labels are therefore packaging. Components and their configuration are the durable model.

## Internal economic truth vs presentation

Do not force customer terms such as Offpeak/Peak to become internal truth merely because they exist in current reports. Likewise, do not force exchange naming to become customer vocabulary. The internal model should use the clearest economic decomposition and support both projections where required.
