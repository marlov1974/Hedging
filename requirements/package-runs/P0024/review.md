# P0024 consistency review

Status: PASS

P0024 is consistent with the current prototype:

- PeaksModern already has four product components: `base.sys`, `base.epad`, `peak.modern.sys` and `peak.modern.epad`.
- Forecast rows already store both monthly forecast MWh and `peak_pct`.
- Calendar rows already store both `total_h` and `peak_h`.
- P0022 already creates four monthly transactions per accepted PeaksModern hedge profile.
- Q-factor lookup is already per portfolio product component and month, so base and peak components can continue to use separate q-factor values.

Correction needed:

- Current `peak.modern` logic uses full peak consumption: `hedge_mwh * forecast_peak_pct / peak_h`.
- P0024 requires premium/shape volume above flat base: `hedge_mwh * (forecast_peak_pct - peak_h / total_h) / peak_h`.
- Negative modern peak MWh/MW must remain valid.
