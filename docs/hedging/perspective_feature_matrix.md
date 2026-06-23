# Perspective Feature Matrix

| Feature | Baseloads | Classic | Modern |
| --- | --- | --- | --- |
| Forecast | Forecast - Baseloads | Forecast - Classic | Forecast - Modern |
| Calloff List | Calloff List - Baseloads | Calloff List - Classic | Calloff List - Modern |
| Position Report | Position Report - Baseloads | Position Report - Classic | Position Report - Modern |
| Data Viewer | Baseloads projected and canonical raw | Classic projected and canonical raw | Modern projected and canonical raw |
| Position | Same canonical position rows viewed by perspective | Same canonical position rows viewed by perspective | Same canonical position rows viewed by perspective |
| Hedge Forecast | Not shown | Hedge Forecast - Classic | Hedge Forecast - Modern |
| Hedge Baseload | Hedge Baseload | Hedge Baseload remains one variant | Hedge Baseload remains one variant |

The PoC uses a perspective selector in the application shell. Changing perspective changes visible feature variants but preserves the selected portfolio.

Data Viewer table labels explicitly identify canonical raw rows versus projected rows.
