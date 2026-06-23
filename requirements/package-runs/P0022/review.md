# P0022 consistency review

Status: PASS

P0022 is consistent with the current prototype:

- PeaksModern portfolios are already detected through product configuration name.
- Forecast rows already exist per portfolio and month.
- Calendar rows already provide `total_h` for monthly MWh to MW conversion.
- Calloff and transaction insertion already exist in the repository layer.
- Portfolio product component rows link product components to Q-factor sets.
- PeaksModern product components include `base.sys` and `base.epad`.

Implementation assumption:

- This package creates base hedge transactions only for `base.sys` and `base.epad`; peak modern transactions remain out of scope as allowed by the package text.
- The editable model is Hedge MWh as the user-edited field. Hedge MW and Hedge % are recalculated from Hedge MWh and displayed as derived values.
