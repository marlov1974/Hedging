# Application configurations

P0021 makes portfolio selection resolve an application configuration.

The selected portfolio's product configuration controls:

```text
application appearance
available features
feature labels
active-feature fallback
context copy
```

## Shared Features

`Portfolio Details` is shared across current application configurations.

If the user changes portfolio and the current active feature exists in the new configuration, it remains active. If the old feature is not available in the new configuration, the UI falls back to the first available feature for the selected application.

## Baseloads Application

Baseloads portfolios use the Baseloads application appearance and feature set:

```text
Portfolio Details
Buy Baseloads
Baseloads Calloff List
Position Report
Financial Settlement
```

Baseloads-specific features are hidden when a non-Baseloads application variant is selected.

## Peaks.Modern Application

Peaks.Modern portfolios use the Peaks.Modern application appearance and feature set:

```text
Portfolio Details
Forecast
Hedge Forecast
Data Viewer
```

Baseloads-specific features are not shown for Peaks.Modern portfolios.

## Appearance

The current PoC uses a minimal shared shell with product-specific variant styling and context copy:

```text
Baseloads application
Peaks.Modern application
```

The styling change is intentionally restrained. The primary behavior is that the product configuration changes the application variant, not just the feature list.

## Known PoC Limitations

- Application variants are resolved from synthetic seed product configurations.
- `PeaksModern` remains a deprecated compatibility alias for `Peaks.Modern`.
- Unsupported product configurations currently fall back to a minimal unsupported application with Portfolio Details.
- Feature authorization is product-context based, not user based.
