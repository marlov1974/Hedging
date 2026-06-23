# Feature-Level Perspective Switching

P0035 moves perspective selection from the application shell into each feature.

The shell shows one generic feature list. A feature decides which perspectives are meaningful for that workflow:

| Feature | Perspectives |
| --- | --- |
| Forecast | Baseloads, Classic, Modern |
| Hedge Forecast | Classic, Modern |
| Calloff List | Baseloads, Classic, Modern |
| Position Report | Baseloads, Classic, Modern |
| Position | Baseloads, Classic, Modern |
| Data Viewer | Canonical, Baseloads, Classic, Modern |
| Hedge Baseload | none |

Switching tabs inside a feature must keep the same portfolio and the same canonical dataset. The tab only changes the projection used by that feature.

Canonical rows remain the source of truth. Projected rows such as `modern.base.sys`, `modern.base.epad`, `modern.peak.sys` and `modern.peak.epad` are display rows only and must not be stored as source transactions.

Feature-level switching supports the PoC goal: the same calloffs, forecasts and positions can be interpreted through Baseloads, Classic and Modern views without creating separate demo portfolios.
