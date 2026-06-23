# Universal Model Demo Tool

The hedging tool demonstrates that one canonical component model can support several customer-facing product perspectives.

The selected customer portfolio is kept fixed while the user switches between:

- Baseloads
- Classic
- Modern

For demo purposes, perspectives can be shown side by side for the same portfolio to prove model compatibility. In production, product package and contract visibility would determine which perspective and features are customer-visible.

Canonical calloffs and canonical customer transactions are the source of truth. Projected Baseloads, Classic and Modern rows are derived views and can be rebuilt from canonical rows.

Modern Forecast and Hedge Forecast use modern base and peak entry terms, then write canonical rows. Classic and Baseloads features read the same canonical rows through their own projections.
