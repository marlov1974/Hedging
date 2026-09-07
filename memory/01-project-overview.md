# Project overview

This repository prototypes a generic component-based hedging, risk and settlement model for energy contracts.

The objective is not to mirror one legacy product or one external market interface. The objective is to model the underlying economics cleanly enough that three distinct representations can be derived from the same internal truth:

- market/execution representation;
- internal operational/economic representation;
- customer-facing representation.

The model separates reusable calculation and lifecycle parts from commercial labels. Important concepts include:

- contract / contract part;
- hedging window;
- portfolio;
- call-off / execution request;
- customer transaction;
- market component;
- profile/shape component;
- risk component;
- settlement view;
- delivery month;
- business event and risk attribution.

The current design focus is B2B hedging portfolios and reusable components such as Sys/EPAD base-price hedge, Profile Risk, Volume Risk, Seasonality Financing and Virtual Product Structuring.

Commercial products are treated as configured bundles of reusable components. Product migrations should therefore be representable by adding/removing/configuring components while preserving economic history.

All examples should remain synthetic and neutral. Candidate parameter values are design examples, not business facts unless explicitly validated.
