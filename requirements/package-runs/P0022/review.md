# P0022 consistency review

Status: PASS

P0022 is consistent with the current prototype:

- PeaksModern portfolios are already detected through product configuration name.
- Forecast rows already exist per portfolio and month.
- Calendar rows already provide `total_h` for base monthly MWh to MW conversion and `peak_h` for peak monthly MWh to MW conversion.
- Calloff and transaction insertion already exist in the repository layer.
- Portfolio product component rows link product components to Q-factor sets.
- PeaksModern product components include `base.sys`, `base.epad`, `peak.modern.sys` and `peak.modern.epad`.

Implementation assumption:

- This follow-up correction creates hedge transactions for all four PeaksModern components. Base transactions use percentage of monthly forecast over total hours. Peak transactions use percentage of monthly forecast times forecast peak percentage over peak hours.
- The editable model is Hedge MWh as the user-edited field. Hedge MW and Hedge % are recalculated from Hedge MWh and displayed as derived values.
