# Component model

## Purpose of this section

Explain how product, market, fee and premium concepts are represented as component rows.

## Notes and requirements for the section

- Explain why components are rows rather than columns.
- Describe customer components, market components and commercial add-ons.
- Mention examples without using internal names.
- Explain that component meaning comes from component code together with leg type and basis type.
- Connect the component model to future product flexibility.

## Current version of the text

The target model represents product and pricing elements as component rows. A component row has a component code and is interpreted together with leg type, basis type, period, price area, quantity and price.

Examples of customer components include `modern.base` and `modern.peak`. Examples of market components include `market.base` rows split by relevant market layer or price area. Examples of commercial add-ons include `fee.calloff`, `premium.q_term` and `premium.p_agent`.

This design avoids product-specific wide tables. A new fee, premium, product layer or risk component can be introduced as a new component row and projection rule, rather than as a new set of columns and bespoke tables.
