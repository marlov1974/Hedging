# Document structure - Hedging target model

## Purpose of the document

This document explains the target information model for the hedging solution in a way that can be discussed with colleagues before implementation details are finalized.

It describes the concepts, event model, component model, canonical models, projections, API/service implications and business requirements behind the design.

The document is not intended to be a low-level implementation specification. Implementation packages live under `requirements/packages/`.

## Audience

The document is intended for colleagues who need to understand the model from a business, product, risk, reporting or architecture perspective.

## Document sections

### 01. Executive summary

Purpose: summarize the target model in a short, business-readable form.

Notes: should explain the separation between customer commercial truth and market/risk truth, the event/detail model, canonical vs projection, and why the model is designed this way.

### 02. Design principles

Purpose: explain the design principles behind the model.

Notes: should cover row-based/component-based modelling, normalized canonical write model, projected read models, historical decision values and avoiding wide product-specific tables.

### 03. Core concepts and vocabulary

Purpose: establish common language before the detailed model sections.

Notes: should define event, event detail, customer leg, market leg, component, canonical model, projection, Modern, Classic, Baseloads, market basis, rebalance, conversion and add-on component.

### 04. Event model

Purpose: explain how business events are represented as events with event details.

Notes: should describe signed rows, append-oriented history, event types and why old events should not be rewritten except for actual corrections.

### 05. Two-legged transaction model

Purpose: explain the separation between customer leg and market leg.

Notes: should clarify that not every event needs both legs. Baseloads normally has market hedge leg only, while Modern/Peaks/Profile-like products require customer and market legs.

### 06. Component model

Purpose: explain components as rows.

Notes: should describe customer components, market components and commercial add-ons as event-detail rows with component codes.

### 07. Canonical models and projections

Purpose: explain what is source of truth and what is derived.

Notes: should cover Modern customer canonical, Market canonical, Classic projection and Baseloads projection from Market canonical.

### 08. Product model: Baseloads, Modern and Classic

Purpose: explain how products map to the information model.

Notes: should explain Baseloads as market-near, Modern as customer basis for shaped products, and Classic as compatibility/projection.

### 09. Market basis and Q-factor logic

Purpose: explain how customer components are translated to market basis.

Notes: should distinguish Q-factor from Q-term and cover value preservation and historical factor storage.

### 10. Commercial add-ons

Purpose: explain fee, Q-term and P-agent as customer-side commercial components.

Notes: should cover product-configuration price components, add-on rows, fee volume logic, Q-term and P-agent following signed modern.peak, and prices remaining per MWh.

### 11. Calloff flows

Purpose: describe how calloffs create event details.

Notes: should cover Baseloads calloff, Modern/Peaks calloff, market legs, customer legs, add-ons and SYS/EPAD separation.

### 12. Baseloads to Peaks/Modern upgrade

Purpose: explain the two-calloff upgrade process.

Notes: should cover market rebalance first, customer conversion second, customer prices derived from the resulting open market position, and no blending of SYS and EPAD/area.

### 13. Downgrade and market-only adjustments

Purpose: explain downgrade policy and factor-driven market-only changes.

Notes: should cover Q/profile changes, market-only adjustments, customer commercial position staying unchanged, and downgrade normally carrying open market basis into Baseloads.

### 14. Reporting and settlement

Purpose: explain how reports and settlement read the correct model layer.

Notes: should distinguish Modern, Classic, Baseloads, market position and settlement views.

### 15. API and service layer

Purpose: explain how the model should be exposed to other systems.

Notes: should state that the target solution is service/API-oriented even if the PoC has a UI, and should describe read/write APIs and backward-compatible Classic interfaces.

### 16. Requirements and model response

Purpose: list business and architectural requirements and explain how the model responds.

Notes: should state requirements first, then describe model response. Avoid presenting design choices as requirements.

### 17. Worked examples

Purpose: make the model understandable through simple examples.

Notes: should include Baseloads calloff, Modern/Peaks calloff, fees, Q-term, P-agent, upgrade, downgrade and market-only adjustment examples.

### 18. Implementation implications

Purpose: summarize what the design implies for implementation.

Notes: should stay high-level and refer to package requirements for detailed work.

### 19. Open questions

Purpose: capture decisions still to be revisited.

Notes: should include downgrade waivers, P-agent beyond PoC, materialized projections, Classic compatibility lifetime and exact component naming.

## Explicit exclusion

The private internal terminology mapping is intentionally not part of this GitHub documentation. Internal names and mappings must not be stored in this public-safe repository.
