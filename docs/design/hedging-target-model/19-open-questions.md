# Open questions

## Purpose of this section

Capture design decisions that are not fully closed and should be revisited before or during implementation.

## Notes and requirements for the section

- Separate open questions from decided model principles.
- Keep the list public-safe and neutral.
- Include policy questions and implementation trade-offs.
- Avoid internal names.

## Current version of the text

Open questions to revisit:

```text
Exact policy and approval flow for waiving downgrade carry-over of open market basis
How detailed P-agent derivation should become beyond simplified examples
Whether selected projections should be materialized for performance or audit
How long Classic compatibility should remain and at which layer it should be maintained
Exact naming convention for market.base SYS and EPAD/area components
How much of the projection logic belongs in APIs versus reporting/read-model services
How to represent product state/subscription separately from event details
```

Additional allocation questions:

1. If a customer has Baseloads and moves to Peaks/Modern without buying or selling additional market basis during the conversion, how should the existing market base position be allocated between `modern.base` and `modern.peak` in the customer conversion?

2. If a customer has Peaks/Modern and buys base first and peak later, how do we keep track of which market base rows belong to `modern.base` versus `modern.peak` for later reporting, conversion, settlement explanation and audit?

These questions do not change the core direction of the model, but they may affect package scope, API contracts, audit design, allocation rules and reporting design.
