# Implementation implications

## Purpose of this section

Summarize what the design implies for implementation without becoming a detailed implementation plan.

## Notes and requirements for the section

- Keep this high-level.
- Refer to package requirements for detailed tasks.
- Cover event detail model, leg type, basis type, component catalog, projection/read models and tests.
- Mention historical decision values.
- Mention that canonical and read models should be separated.

## Current version of the text

The target design implies a generic event-detail model with explicit leg and basis fields. Stable fields such as event id, leg type, basis type, component code, period, price area, quantity and price should be typed fields rather than arbitrary attributes.

The implementation needs a component catalog and projection logic that can derive Modern, Classic, Baseloads, market basis, position and settlement views from canonical event details. Compatibility APIs and reports may be shaped differently from the canonical model.

Tests should focus on value preservation, signed rows, projection correctness, backward compatibility and product migration flows. Historical decision values such as Q-factor used and configured add-on price used should be stored where they were part of the decision.
