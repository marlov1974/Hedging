# Single Demo Portfolio

The P0035 UI uses one primary demo portfolio in the main application flow.

The older product-specific portfolios remain useful as internal compatibility fixtures and targeted tests, but they are no longer presented as the primary way to compare product models. The demo should show one portfolio and multiple perspectives, not multiple portfolios that happen to contain similar data.

This avoids a misleading product-selection model:

```text
Baseloads Portfolio
Peaks.Classic Portfolio
Peaks.Modern Portfolio
```

The intended model is:

```text
Baseloads Portfolio
  Forecast: Baseloads | Classic | Modern
  Calloff List: Baseloads | Classic | Modern
  Data Viewer: Canonical | Baseloads | Classic | Modern
```

The hidden fixed portfolio state keeps forms and links deterministic, but the visible UI does not expose a central portfolio selector. Feature links preserve the same demo portfolio id while feature-level perspective tabs change only that feature's projection.
