# Memory index

This memory folder stores durable, sanitized project understanding for AI and Codex sessions.

Read order is defined in `memory/bootstrap-manifest.json`.

Current durable memory set:

- `01-project-overview.md` — scope and purpose of the hedging model.
- `02-design-principles.md` — architectural and modeling principles.
- `03-component-model.md` — canonical component vocabulary and boundaries.
- `04-domain-architecture.md` — three representation layers, legacy evolution and product philosophy.
- `05-b2b-product-components.md` — detailed current B2B component design: Sys/EPAD, Profile Risk, Volume Risk, flat pricing and virtual products.
- `06-risk-journal-and-events.md` — event/journal thinking, risk attribution, offer risk and netting.
- `07-settlement-product-migration.md` — settlement, invoicing, PF Flex/PF Andel and component migration behavior.
- `08-open-questions.md` — provisional decisions and unresolved design points.
- `2026-06-23-canonical-hedging-model-session-summary.md` — older detailed session baseline; useful historical context but newer focused memory files take precedence where they differ.

When bootstrapping a new session, read the focused numbered files before the older historical session summary.

Latest continuation: [2026-09-07-resource-hedging-design-handover.md](2026-09-07-resource-hedging-design-handover.md). Read after the focused files and June baseline. Covers resource-level customer legs, aggregate market legs, rebalancing, ended resources and the next B2C contract-event discussion; no code implementation is implied.
