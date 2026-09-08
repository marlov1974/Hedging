# P0038 Review

## Consistency result

PASS.

## Evidence

- `docs/hedging/component_catalog.md` now defines canonical, projected, alias and reserved component concepts.
- `src/database/canonicalComponents.ts` already centralizes component metadata and aliases, but it does not expose explicit concept classification.
- `src/database/validation.ts` still has a separate known-code list, which can drift from the central metadata.
- Product component insertion is the useful persistence seam: transactions reference product component ids, so blocking projected-only product components prevents persisted transaction rows from using projected codes.
- Modern projected names currently appear in Data Viewer/projected output types, not as seed product components.

## Assumptions

- `allocation.peak` remains a legacy single-row compatibility component, not a true automatic one-to-two expansion.
- Older entries such as `base.classic.*`, `peak.classic.*`, `profile.15m`, `volume.flex`, `fixed` and `calendar` should remain as reserved/compatibility metadata because existing package history and fixtures still reference them.
- Runtime behavior should remain stable except for rejecting projected-only component codes in persisted product component configuration.
