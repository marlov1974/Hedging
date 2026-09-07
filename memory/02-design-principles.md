# Design principles

- Keep examples generic, synthetic and public-safe.
- Prefer explicit component boundaries over implicit commercial labels.
- Separate **market**, **internal** and **customer** representations. They may differ, but translations must be explicit and testable.
- Treat the internal operational/economic model as the conceptual core. Market and customer representations are projections of it.
- Do not let legacy customer presentation dictate canonical internal structure.
- Do not let market instrument naming dictate customer vocabulary.
- Model commercial products as reusable components plus configuration rather than isolated hard-coded bundles.
- Preserve economic history across product changes. A product migration should normally add, remove or reconfigure components rather than reset the model.
- Attribute economic outcome to the **business event/risk cause**, not merely to the market instrument used for execution.
- Allow customer-level needs to be aggregated/netted before market execution while retaining detailed internal attribution.
- Distinguish pricing/bundling rules from product components. A different combination price does not automatically imply a different product component.
- Distinguish active product state from residual economics. A component may be removed while residual settlement effects remain.
- Prefer deterministic, automatable settlement rules over manual exceptions, annual after-the-fact processes and special site-allocation rules.
- Keep regulatory/reporting capabilities such as EMIR independent where possible from the commercial product taxonomy.
- Treat candidate numeric parameters (for example a suggested high volume cap) as provisional until validated.
- Newer verified requirements and explicit design decisions take precedence over older memory files.
