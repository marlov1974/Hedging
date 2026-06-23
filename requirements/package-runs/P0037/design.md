# P0037 Design

## Interpretation

Create `docs/hedging/component_catalog.md` as the durable glossary for canonical components, projected component names and deprecated aliases.

## Implementation Structure

- Add the required catalog with the ten requested sections.
- Include the current canonical Peaks component set and reserved broader components.
- Document Modern and Classic projected components as non-persisted projection names.
- Document alias rules and sys/epad double-counting rules.
- Add short links from existing component/projection docs to the new catalog.
- Add a documentation test that validates required terms and rules.
- Update `REPOSITORY_FILES.md`.

## Deliberate Non-Changes

- Do not change runtime projection formulas.
- Do not rename source components.
- Do not remove compatibility aliases.

## Test Strategy

- Run the new documentation test through `npm test`.
- Run full `npm test`.
- Run `git diff --check`.
- Verify `REPOSITORY_FILES.md` against `git ls-files`.

## Risks

- Some older docs still mention historical names. P0037 should clarify via the catalog and links without broad rewrites.
