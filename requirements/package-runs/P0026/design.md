# P0026 Design

## Package Interpretation

Build a `Legacy Calloff List` feature that projects canonical Peaks.Classic transactions into Peak/Offpeak customer rows.

## Implementation Structure

1. Add Peaks.Classic application detection and feature gating.
2. Update seed data so Peaks.Classic has canonical components needed by the projection.
3. Add `legacyCalloffList.ts` to calculate projected rows from canonical calloff transactions.
4. Add UI rendering for `Legacy Calloff List`.
5. Add docs for the projection and projected price rules.
6. Add focused tests for positive, negative, aggregation, warnings and raw Data Viewer preservation.

## Projection Rules

- Use `base.sys` as volume carrier when both base rows exist.
- Use `allocation.peak` for legacy peak volume.
- Calculate offpeak as residual from base total volume.
- Use base price as offpeak price.
- Calculate peak price with residual value preservation.
- Ignore allocation as a displayed customer row.

## Risks

- Existing seed tests assumed Classic and Modern had different component structures. Those tests need to be realigned to the canonical model.
- The feature has no purchase UI, so tests create canonical calloffs directly.
