# Resource-based hedging — design handover, 2026-09-07

## Purpose, authority and scope

Continue the portfolio-hedging design discussion in a new chat without reconstructing it from unrelated report prose.

This is a generic, public-safe target-design note. It records user decisions and corrections made in the September discussion, not a claim about production practice or completed prototype implementation. Names of actual products, counterparties, systems and organizations have been replaced by generic roles. No real prices, customer data or commercial terms are included.

Read this AFTER the June 23 canonical-model snapshot. Use it as the latest design direction for resource ownership, two-leg placement, rebalancing and resource lifecycle. Preserve June calculation/projection semantics unless explicitly changed here. Exact storage/schema and mathematical reconciliation still require design work. This handover is not an implementation package and does not authorize unrequested code changes.

The surrounding report work remains separate. The user deferred updates to that report's source files; this session only saves the hedging handover here.

Status labels:
- DECIDED: explicitly established/corrected by the user in this discussion.
- DESIGN IMPLICATION: useful consequence or assistant elaboration, not a fully specified rule.
- HISTORICAL RECALL: retrieved prior conversation; weaker than inspected repository specifications.
- OPEN: unresolved; do not silently invent.

## 1. Resource is the common ground object — DECIDED

Use resurs / resource. Physical assets and residuals are the same object class with different properties, not two incompatible models.

A resource represents an identifiable portion of a customer's energy system that can carry service components, forecasts, customer transactions and economic consequences. Physical equipment is one boundary type; a residual is the remainder after separately represented resources are excluded.

Services and their underlying business state are assigned per resource. A customer may select an offer for an entire group, subsidiary, site or portfolio; that selection resolves to the included resources. Do not create independent competing assignments at every organizational level.

Resource properties determine applicable forecasting, pricing and control behavior. Distinguish physical identity, direct/derived measurement, controllability, mandate and heat dependence. An uncontrolled physical asset need not be a residual.

Accounting boundary: no underlying energy volume is counted both as a separately represented resource and in the residual. Changes of partition require effective dates and retained history.

Aggregation remains valuable for a specific business purpose: user decisions, forecasting collectives, diversification, optimization, market access and presentation. Preserve detail continuously; do not require every decision or calculation to operate in isolation at resource level.

## 2. Residual types — DECIDED

Two residual variants:
1. With uncontrolled heat production: forecasting collectives grouped by climate zone.
2. Without uncontrolled heat production: a separate forecasting collective aggregated by price area.

Climate zone and price area serve different functions. Keep the relevant price-area relationship when valuing heat-dependent forecasts. No climate-zone taxonomy or exact statistical model was chosen.

An apartment with no separately handled equipment is the simplest residual-only case. A house whose heat and other separately handled loads have been removed from the residual can use the same no-heat residual type. Do not assume identical volumes or profiles merely because resources share a type.

## 3. Component-based services and customer choices — DECIDED

Separate:
- Offer: commercial packaging bought by the customer.
- Product configuration: selected combination of components.
- Product component / contract part: reusable bounded customer value or obligation.
- Price component: calculated price contribution.

Traditional product labels describe combinations; they must not define separate production engines.

Required illustrative target behaviors:
- Spot pricing (including 15-minute or monthly packaging) can differ by resource/site.
- A customer can select spot and optimization for controlled equipment, with fixed price on the residual.
- Fixed price for an entire customer energy system is still calculated and risk-assessed using resource characteristics, then combined for the customer.
- Controlled heat equipment may have a different expected profile/cost/risk. A pricing advantage is a hypothesis to calculate, not an automatic guarantee.
- Merely excluding a heat load from the residual's fixed-price scope can materially change the pricing and risk problem.
- Environmental attributes may be selected for groups of resources belonging to different legal entities or activities.
- Portfolio hedging can span the full customer portfolio.
- Collective imbalance handling may cover most resources, with explicit individual treatment for selected industrial resources.
- Flexibility may apply to one resource; available flexibility can also support portfolio imbalance management subject to commitments, customer needs, restoration and economics.
- Industrial customers may retain their own planning, optimization and physical control while consuming selected market-access capabilities. Provider-managed optimization is not compulsory.

These are target capabilities, not assertions about current offers or regulatory eligibility.

## 4. Portfolio call-off: one decision, resource calculations — DECIDED

The advisor or customer stands on an aggregate:
- sees its total forecast;
- sees the aggregate/portfolio position;
- initiates ONE call-off for the chosen scope and delivery period.

The customer-facing action stays aggregated regardless of who initiates it. Changing actor is a mandate change, not a reason to rebuild the calculation model.

The decision is then applied in each resource's own information product/business state using that resource's forecast, existing state, product components, q-factor, v-term and terms. Results aggregate to the portfolio market leg.

Conceptual sequence:
aggregate view -> one call-off intent -> resource-specific calculations/customer legs -> aggregate market leg -> traceable positions and economics.

Do not describe this as many independent manual call-offs.
Do not average away different q-factors/v-terms before computing resource contributions.
Aggregate business logic may still account for portfolio effects; this is not a requirement for entirely separable risk models.
No final formula for v-term or q-factor conversion was established in this session.

## 5. Two-leg model and Classic — DECIDED

User recalled the previous call-off model as:
- market leg;
- customer leg, described as Modern;
- Classic view reproducible using these.

September change:
- customer leg / Modern is at RESOURCE level;
- market leg / Market is at PORTFOLIO or AGGREGATE level;
- Classic remains a derived view, not a third independent obligation;
- an aggregated Modern customer view remains possible.

One call-off identity needs traceable links to resource contributions and the aggregate market commitment. Detail should support customer explanation without forcing the advisor to navigate every resource.

### Important reconciliation with the inspected June snapshot — OPEN

The June snapshot distinguishes persisted canonical components from Modern/Classic projections:
- canonical Peaks: allocation.peak.sys, allocation.peak.epad, base.sys, base.epad, peak.sys, peak.epad;
- modern.* and classic.* are projected names, not persisted source-of-truth codes;
- allocation rows are not extra physical energy;
- sys and epad dimensions must not be double-counted as energy;
- projection transformations preserve the intended value and volume semantics.

The September phrase "Modern customer leg on the resource" is a BUSINESS placement decision. It does not by itself reverse June's storage/projection policy or authorize persisting modern.* as canonical codes. Decide the precise resource-level canonical representation before implementation.

## 6. Full hedging commitment — explicit user correction

A hedging call-off is taken in FULL by the market-facing counterparty. That role carries liquidity and external execution responsibility.

Do NOT introduce partial fills at the customer/resource level based on immediately available external liquidity. The assistant's earlier suggestion to allocate partial execution back to resources was rejected.

This is the generic target interface contract recorded here, not a statement about all markets or other products. It does not specify error handling for rejected/invalid requests.

## 7. Resource parameters, ownership and economics — DECIDED

Different resources under the same customer can have different v-terms and q-factors. Industrial processes need not be priced or risk-treated like office residuals.

Resource customer legs support attribution of costs, revenues and upside/downside to the right legal entity. The intended customer value is coordinated procurement/hedging without unintended cross-subsidies between subsidiaries.

DESIGN IMPLICATION:
- retain forecast/parameter versions used by each call-off;
- retain the relevant legal-entity attribution through resource lifecycle changes;
- define allocation rules for genuine shared costs and portfolio benefits;
- trace resource economics to site/POD, legal entity and portfolio without duplicating economic values.

Shared production can serve B2B and B2C. Differences remain in contracts, mandates, customer choices and scale; a small customer may still have complex resources.

## 8. Rebalancing and internal matching — DECIDED / details OPEN

Resources may be added, removed or change forecast, followed by a rebalancing request.

The rebalancing calculation must compare the new requirement with EXISTING transactions/commitments. Updating forecast does not rewrite a previous trade.

User example: one resource reduces its requirement while another increases it. Match compatible changes internally before putting the residual net requirement to the market-facing role. The proposed benefit is avoiding an unnecessary external buy/sell spread.

User price direction: the selling resource can sell at the buying price to the receiving resource, with one common internal transfer price.

Still OPEN:
- exact reference/time meant by "buying price";
- matching eligibility by period, price area, component, currency and other terms;
- transaction postings preserving both original and offsetting positions;
- attribution of realized/unrealized value and spread benefit between legal entities;
- effect on q-factor/v-term and Classic/Modern projections;
- treatment when the portfolio has no offsetting internal need.

Earlier assistant descriptions of "moving" a position are conceptual only. Do not implement destructive ownership rewrites or delete original transactions.

## 9. Positions persist; opposite positions offset them — DECIDED

A position is not removed by closing exposure. Create an opposite position.

Both purchase and sale stay in the portfolio with their volumes, periods and prices. Net energy exposure may be zero while economic value remains. A net-position view is a calculation over surviving transaction records.

User explicitly corrected language implying that an original position could simply disappear. This principle applies to lifecycle/rebalancing design. Internal transfer postings must be worked out consistently with it.

## 10. Disappearing resource — DECIDED

A resource that leaves active delivery remains the holder of its upside/downside.

Required behavior:
- its current forward forecast becomes ZERO from the end of active delivery;
- previous forecast versions are retained for historical interpretation;
- original transactions and counterpositions remain linked to it;
- economic contributions continue into the portfolio and correct legal entity;
- it must NOT appear in ordinary resource drilldown views;
- economic history must remain traceable without making it an active navigable resource.

Keep separate:
1. active delivery/planning membership;
2. economic contribution and surviving obligations;
3. ordinary drilldown visibility;
4. historical/audit access.

Do not filter financial totals using the active-resource UI filter. An invisible ended resource can still contribute value. Do not distribute its remaining loss or gain to active resources merely because it has disappeared physically.

Exact statuses, forecast-reset events, retention and UI reconciliation design are OPEN.

## 11. Why retain detail continuously — design rationale

A generic legacy workflow can reconstruct site-level consumption for a portfolio forecast, aggregate for hedging, and later allocate settlement by actual POD consumption. In such a workflow, the detail already exists but is recreated at different stages.

Target direction:
1. automate and preserve forecasting inputs;
2. keep unaggregated business context continuously while exposing useful aggregates;
3. allow a site to be partitioned into distinct resources when useful;
4. reuse the underlying production model across customer segments.

A possible incremental approach discussed by the assistant was one residual resource per site first, then splitting out equipment. This is an implementation option, not a user-approved migration package.

Distinguish two changes:
- preserving/automating existing detail and links;
- changing customer economics through resource-specific parameters and attribution.

The latter can differ from settlement allocation by actual consumption and must be verified explicitly. Do not sell it as only technical automation. More detail alone does not prove better forecasts or pricing.

## 12. Historical component recall and repository evidence

Personal-context search found June 17–22 discussion of:
- five packages: Baseloads, PeaksClassic, PeaksModern, ProfilesClassic, ProfilesModern;
- early codes: base.sys/epad, base.classic.sys/epad, peak.classic.sys/epad, peak.modern.sys/epad, profile.sys/epad, volume;
- one QFactorSet per product-component instance, with monthly QFactorValue entries and aligned component vocabulary;
- a reference to P0015.

These early names are HISTORICAL, not a request to restore obsolete codes. The inspected June 23 snapshot documents later canonical names and explicit aliases. Read that file and the relevant packages before choosing implementation names/formulas. Old recalled sample q-factor ranges are not approved current parameter defaults.

Useful existing paths:
- memory/2026-06-23-canonical-hedging-model-session-summary.md
- memory/04-domain-architecture.md
- memory/05-b2b-product-components.md
- docs/hedging/canonical_component_model.md
- docs/hedging/modern_projected_model.md
- docs/hedging/classic_projection_price_rules.md
- docs/market-derivation/q_factor_model.md

The June snapshot and numbered memory files 01–08 were inspected while writing this handover. Other paths are pointers, not claims of a full code/spec audit.

## 13. B2C contract events — unfinished discussion / next starting point

The last active design question was: what separate parts should the customer leg contain, drawing on the earlier B2C contract-event model?

Established high-level historical idea:
contract events -> active contract stock -> expected consumption -> call-off volumes / hedge need.

Personal-context retrieval reported user-accepted May 18 decisions:
- PreContractHedge operates at HedgingWindow level, NOT individual contract level;
- follow up by HedgingWindow and delivery month, optionally portfolio/segment;
- ForecastHedgeNeed as a separate account;
- initial forecast booking Dr SalesForecast / Cr ForecastHedgeNeed.

This is HISTORICAL RECALL, not a newly verified specification in this repo.

A prior assistant output mentioned gross contract volumes with separate regret/churn reserves. Final user acceptance and exact posting design were not recovered. Do not treat that proposed account breakdown as settled.

Earlier context lists candidate events: verbal agreement, signing, credit/migration acceptance, end of cancellation window, delivery start, changed annual volume, churn and segment change. Their exact accounting effects and version order were NOT recovered.

A later context pointer identifies a prior conversation titled "Hedging B2C med contract events", dated 2026-03-13. Use it for targeted personal-context retrieval if available. The spring model may have evolved through May; do not assume one partial recall is the final version.

Still to resolve:
- exact customer-leg components/accounts;
- event effects on gross volume, uncertainty/reserves and hedge need;
- handover from sales forecast/pre-contract hedge to actual contract without double counting;
- mapping contract events to resources and effective service-component assignments;
- how B2C and B2B share the model while pre-contract need remains aggregate;
- resource-level q-factor/v-term behavior through lifecycle events.

Terminology correction: pre-contract hedging is prissäkring, not insurance/försäkring.

## 14. Instructions for the next chat

1. Bootstrap from README/AGENTS and the June snapshot, then this handover.
2. Briefly confirm the resource/customer-leg versus aggregate/market-leg split.
3. Continue with the unresolved B2C contract-event breakdown of the customer leg.
4. Separate user decisions, inspected prototype semantics, historical recall and new proposals.
5. Never reintroduce liquidity-limited customer fills, deletion of past trades, disappearing resource economics or independent residual/asset models.
6. Do not modify report sources or implement the prototype merely because this handover exists.
7. When implementation is requested, inspect the active requirements and code, resolve the explicit open questions, and create the appropriate package.

## 15. Concurrent focused-memory additions inspected during save

While this handover was being saved, main received focused memory updates (baseline commit 9d29da21cb9c009411ef970f0311977deded2368). They were preserved and read. The numbered memories are the more recent component baseline relative to the June snapshot; this September handover adds resource placement, not a blanket replacement of their formulas.

Read memory/04-domain-architecture.md through memory/08-open-questions.md for:
- separation of market, internal economic and customer representations;
- Sys/EPAD, Profile Risk, Volume Risk, Seasonality Financing and Virtual Product Structuring;
- 15m Profile: full monthly base volume plus (Q-factor - 1) times monthly volume as extra base-equivalent exposure; customer representation is full monthly volume times Q-term;
- Q-factor is dimensionless; Q-term is a price premium. Do not conflate them;
- V-term is a separate component and changes settlement behavior through Volume Risk; not every customer component has a matching external market hedge;
- removing Volume Risk creates a reversal at the latest V-term and preserves residual economic value;
- attribution follows the CAUSING EVENT, not the instrument used to execute its effect;
- offer-risk/pre-contract context at hedging-window level, separate from later volume/profile change events.

Explicit reconciliation still required:
- the focused notes place certain volume-tolerance settlement rules at aggregate contract/portfolio level; resource-level customer state does not automatically relocate that tolerance calculation to each resource;
- resource detail and portfolio-level risk/settlement effects must coexist without double counting;
- one monthly forecast plus a profile/Peak q-factor is a target in the focused notes; reconcile with older June canonical/projection formulas before implementation;
- the focused risk journal expands historical recall, but the complete B2C event-to-posting design and forecast-to-contract transition remain unresolved.

No concurrent file was overwritten with an older version. The handover preserves uncertainty rather than choosing new formulas for these intersections.
