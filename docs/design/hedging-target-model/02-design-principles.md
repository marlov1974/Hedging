# Design principles

## Purpose of this section

Explain the modelling principles behind the target design.

## Notes and requirements for the section

- State the preference for few stable columns and many component rows.
- Explain that components should be rows, not columns.
- Distinguish canonical write model from projected read/report models.
- Explain that facts should be stored once where possible.
- Explain that historical decision values must be stored when they were part of the business decision.
- Avoid describing the model as a generic key/value design; stable concepts should remain real fields.
- Make the section understandable for colleagues who are not data modellers.

## Current version of the text

The target model follows a row-based and component-based design. Base, peak, market base, fees, premiums and future product elements should be represented as component rows rather than as product-specific columns. This keeps the model flexible when new products, price areas, fees, premiums or risk layers are introduced.

The canonical model should be normalized and stable. It should store business events and their atomic details once, with enough historical information to explain what was decided at the time. Projections, reports and API responses can be shaped differently for consumers, but those shapes should not become competing sources of truth.

This does not mean everything should become a generic key/value structure. Stable concepts such as event id, leg type, basis type, component code, period, price area, quantity and price should remain explicit fields. Flexibility should come from components and projections, not from making the entire model untyped.
