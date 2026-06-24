# P0038 Design

## Interpretation

P0038 should turn the P0037 glossary into small runtime guardrails without redesigning the model.

## Implementation Structure

- Add explicit component concept constants and helpers in `src/database/canonicalComponents.ts`.
- Classify component codes as:
  - `canonical`
  - `projected`
  - `compatibility_alias`
  - `reserved`
  - `unknown_adjustment`
- Keep deprecated alias canonicalization for old rows.
- Add a source-of-truth guard helper for persisted product component codes.
- Change `validation.ts` to use the central guard instead of its own known-code set.
- Keep projected `modern.*` rows allowed in Data Viewer output only.
- Add tests for classification, projected-only rejection, alias behavior and unchanged projection behavior.

## Deliberate Non-Changes

- No projection formula changes.
- No forecast or hedge forecast flow changes.
- No seed redesign.
- No alias removal.

## Test Strategy

- Add focused tests for the component-code helper surface.
- Add repository validation tests proving projected-only codes cannot be inserted as product components or q-factor set components.
- Keep P0037 catalog test passing.
- Run full `npm test`, `git diff --check`, and file-index verification.

## Risks

- Making aliases too strict could break legacy compatibility tests. P0038 keeps aliases accepted for persisted compatibility where they already exist.
