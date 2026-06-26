# Core concepts and vocabulary

## Purpose of this section

Establish common language for the target model before describing the detailed event, component and projection model.

## Notes and requirements for the section

- Define the core concepts in plain English.
- Avoid internal system names and internal business shorthand.
- Keep definitions neutral and public-safe.
- Make clear which concepts are canonical and which are projections or views.
- Avoid turning this section into a technical schema.

## Current version of the text

An event is a business occurrence that changes or records a position, for example a calloff, rebalance, conversion or adjustment. An event detail is the atomic row created by an event, such as a market base row, a modern peak row or a fee row.

A customer leg represents the customer-facing commercial product position where such a position must be represented explicitly. A market leg represents the market-facing hedge, risk and settlement position. A component is a meaningful row type, identified by a component code, such as `modern.base`, `modern.peak`, `market.base`, `fee.calloff`, `premium.q_term` or `premium.p_agent`.

A canonical model is a source of truth. A projection is a derived view used for a report, API, compatibility interface or customer-facing representation. Modern is the customer canonical basis for shaped products. Classic is a projection and compatibility layer. Baseloads is a market-near product projected from market basis. Market basis is the canonical market/risk/settlement representation.
