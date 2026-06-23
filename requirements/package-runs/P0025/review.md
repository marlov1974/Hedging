# P0025 Review

## Classification

WARN

## Result

The package is consistent with current repository state and can be implemented as a controlled refactor.

The current PoC already stores component transactions in `mw`, has delivery month fields on calloffs, and has Peaks.Modern hedge generation isolated in `src/hedging/forecastHedge.ts`. The required canonical component shift can therefore be scoped to component metadata, seed data, Peaks.Modern generation, projection filtering, tests and documentation.

## Assumptions

- Old product names and old `peak.modern.*` components remain accepted as deprecated aliases where needed for compatibility.
- New seed data and new Hedge Forecast transactions use target product package names and target canonical component codes.
- Component category and hour basis are stored on `ProductConfigurationComponent` instead of introducing a separate catalog table in this package.
- Market projection is implemented as a lightweight category-based helper, not as a broad visibility framework.
- Profiles are reserved in vocabulary and docs only; no full Profiles flow rebuild is in scope.

## Risks

- Existing UI/tests use the old `PeaksModern` label in several places and need careful compatibility updates.
- Data Viewer raw/internal views must continue showing all rows, including `allocation.peak`.
- Position and settlement calculations must avoid treating duplicate sys/epad components as a single physical volume unless explicitly scoped by their current feature logic.
