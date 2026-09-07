# B2B hedging portfolio components

This file captures the current product-component design for B2B hedging portfolios. Treat commercial product names as packaging; the durable model should be expressed in reusable economic components plus configuration.

## Current component families

The working component families are:

- base price hedge, increasingly better described internally as **Sys / EPAD** rather than a single generic Baseload concept;
- **Profile Risk**;
- **Volume Risk**;
- **Seasonality Financing / Flat Pricing**;
- **Virtual Product Structuring**.

Standalone EPAD premium is a pricing/bundling rule, not a separate product. If EPAD costs more when bought without Sys, that is analogous to bundle pricing: the underlying component is the same but the quoted price depends on the combination.

## Base price hedge: Sys and EPAD

The earlier working label `Baseload` was useful but too coarse because it mixes two different concepts:

- the temporal shape of a market hedge, such as a base block;
- the price decomposition of the customer's hedge into Sys and area differential (EPAD).

For the internal product/component model, it is likely more precise to represent:

- **Sys** as the fundamental system-price hedge;
- **EPAD** as the area-price differential hedge.

In the market/execution layer, base blocks and other exchange-like structures can still be used as the executable representation.

### Common execution/representation needs previously associated with Baseload

The component should be able to retain both:

- monthly slices;
- underlying market/trading blocks.

This allows different views without duplicating economic truth.

Relevant configurable settings/features include:

- pricing via Price API or negotiated trading-floor price;
- invoice receiver / receiving profit center;
- VAT treatment where legally/commercially relevant;
- currency treatment;
- financial-style transaction list based on market blocks;
- portfolio-style transaction list based on monthly slices;
- simplified/basic transaction view where Sys and EPAD may be combined;
- position report;
- market-value reporting where applicable;
- EMIR or EMIR-like approval/reporting flows where applicable.

Historical commercial variants that once appeared structurally different were in fact largely configuration differences around the same economic base hedge. Avoid reintroducing hard variants unless the economics genuinely differ.

## Profile Risk

Two working profile variants exist: **15m Profile** and **Peak Profile**.

### 15m Profile

The clean internal hedge logic is:

1. hedge the full monthly volume in the base-price component;
2. hedge the extra profile exposure as `(Q-factor - 1) * monthly volume`, expressed in base-equivalent volume.

Example:

- monthly volume = 100 MWh;
- Q-factor = 1.20;
- extra profile hedge = 20 MWh base equivalents.

The customer-facing representation differs intentionally:

- customer transaction = 100 MWh × Q-term.

`Q-factor` is dimensionless and represents the shape cost relationship. `Q-term` is the commercial premium in currency/MWh. Do not conflate them.

The translation between customer view and internal/market representation must be explicit and testable.

### Peak Profile

Legacy PF Energy / PF MWh products are customer-facing as Offpeak/Peak. The old internal logic also lets Peak structurally own part of monthly volume, which makes the model unnecessarily difficult.

Target direction:

- store one full monthly base-price volume;
- represent Peak only as a profile uplift above that full volume;
- use a customer-specific **Peak Q-factor** to derive that uplift;
- project to legacy Offpeak/Peak only where customer contracts/reports still require it.

The Peak Q-factor should be calculated at contract start and refreshed periodically from historical consumption. The agreement therefore does not need separate Peak and Offpeak forecast volumes as canonical fields.

Longer-term target: move contracts toward a common Nordic peak definition and describe Peak as a business-near profile hedge priced between pure base-price hedge and full 15-minute profile hedge, rather than retaining country-specific Peak/Offpeak semantics indefinitely.

## Volume Risk

Volume Risk is not just a premium. It changes settlement behavior.

The commercial premium is **V-term**. It is currently a precomputed segment-specific premium and is not itself hedged/backed against the market-access party. Customer and internal transaction representation can be `monthly volume × V-term`.

V-term should be its own transaction/component rather than a markup hidden inside another hedge transaction. This allows the component to be added, removed and followed independently.

### Settlement meaning

Without Volume Risk, volume deviations remain customer exposure and should be settled as variable/unhedged volume.

With Volume Risk, the portfolio position is converted into a fixed-price treatment according to the configured volume-risk rules when the delivery month begins. The component therefore changes the settlement function, not merely the quoted premium.

### PF Flex

PF Flex is best understood as a capped tolerance around the reference/forecast volume.

Recommended simplification:

- evaluate and settle flex **per month**, not across the year;
- evaluate it at the **aggregated contract/portfolio level**, not through special allocation rules across individual sites;
- remove legacy alternatives that spread flex evenly across sites or force flex onto a designated parent-company site unless a genuinely necessary exception remains.

Annual flex creates manual follow-up, forgotten settlements and avoidable customer conflict. Monthly flex is more deterministic and automatable.

A useful interpretation is that **15m Profile without Volume Risk = PF Flex with 0% volume flex**. The profiled hedge applies to the covered volume, while every volume deviation is immediately variable/unhedged.

### PF Andel

PF Andel is a share-based fixed/variable construct. A configured share of forecast is fixed; the remainder is variable.

Example:

- forecast = 100 MWh;
- fixed share = 90%;
- 90 MWh receives fixed portfolio treatment;
- 10 MWh remains variable.

The historical or informal idea of unlimited supplier volume exposure should be replaced by an explicit high but finite cap where possible. A cap around 50% has been discussed as a plausible starting point, subject to commercial/risk validation. A clear high cap is preferable to vague disclaimers that are difficult to enforce operationally.

### Removing Volume Risk and V-term reversal

When Volume Risk is removed, the existing V-term position should still be reversed, but the reversal uses the **latest V-term price**, not the original price.

If the V-term price has changed, the original and reversal transactions do not net economically to zero. The difference becomes a residual premium or discount embedded in the position used for settlement.

Example:

- original: +100 MWh × 20;
- reversal: -100 MWh × 30;
- residual economic effect: -1,000 in the relevant currency.

That residual remains in settlement economics even though the active Volume Risk component has been removed. It should be modeled as residual settlement basis/economics, not as an active new Volume Risk service.

## Seasonality Financing / Flat Pricing

Purpose: let the customer pay the same price/MWh across a defined period even though winter and summer hedge costs differ.

The financing/interest effect is borne by the market-access/trading side and should be reflected in pricing.

Working variants:

- `ANNUAL_FLAT`;
- `CONTRACT_PERIOD_FLAT`.

The component family is **Seasonality Financing**; customer-facing labels can use more intuitive terms such as Flat Annual Price.

## Virtual Product Structuring

This component covers value-added synthetic/virtual products where the customer wants a hedge period not yet available as a standard listed market product.

Example: only a calendar-year future exists, while the customer wants January or Q1 of a later year.

The market-access/trading side can synthesize the product and charge a structuring/risk premium. The company may additionally apply an internal pricing-agent/value-added markup. This is a structuring component, not the same type of exposure as Profile Risk or Volume Risk.
