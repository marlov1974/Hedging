# Hedging tool shell

P0017 introduced the first local hedging tool shell. P0018 refined it into a compact work surface. P0020 removes remaining visual-only shell elements and adds the Financial Settlement feature. P0021 makes portfolio selection switch the application configuration.

## Portfolio Context

The tool starts with portfolio selection. The selected portfolio becomes the active context for all feature panels.

The compact top selector shows portfolio choices from the synthetic seed database. The selected portfolio is visible inside the selector and is not duplicated elsewhere in the shell.

Detailed portfolio fields are shown only in the `Portfolio Details` feature:

```text
portfolio name
customer name
customer number
price area
product configuration name
calendar id
```

If no portfolio is selected, the feature area asks the user to select a portfolio first.

## Application Configuration

The selected portfolio's product configuration determines the application variant. Current variants are documented in `application_configurations.md`.

```text
Baseloads portfolio -> Baseloads application appearance and features
PeaksModern portfolio -> PeaksModern application appearance and features
```

If the selected active feature does not exist in the new application variant, the shell resets it to the first available feature in that variant.

## Feature Navigation

The current Baseloads features are:

```text
Portfolio Details
Buy Baseloads
Baseloads Calloff List
Position Report
Financial Settlement
```

The current PeaksModern features are:

```text
Portfolio Details
Forecast
```

Feature availability is evaluated from the active portfolio application configuration.

## Minimal Layout

The shell intentionally avoids large page headings, subtitles, decorative cards and visual-only status controls. The top area is reserved for compact portfolio selection.

Portfolio details are not repeated above every feature. They live in the dedicated `Portfolio Details` feature.

## Baseloads Purchase Feature

The shell reuses the P0016 Baseloads purchase business logic. A successful purchase creates:

```text
one Calloff
monthly base.sys Transactions
monthly base.epad Transactions
```

The shell does not duplicate transaction construction. It delegates to `purchaseBaseloads`.

## Portfolio Details Feature

`Portfolio Details` displays the selected portfolio context:

```text
portfolio name
customer name
customer number
price area
product configuration
calendar id
```

## Position Report Feature

`Position Report` shows monthly component positions for the selected portfolio. It uses a year dropdown and aggregates rows by:

```text
month
component
```

The report uses MWh and weighted average price rules documented in `position_report.md`.

## Financial Settlement Feature

`Financial Settlement` shows monthly settlement rows for the selected Baseloads portfolio.

The feature uses a month dropdown and combines `base.sys + base.epad` into one component group. The settlement formula is:

```text
financial_settlement = hedge_volume_mwh * (monthly_spot_price - hedge_price)
```

Positive value means spot price is above hedge price.

The feature uses monthly average spot actuals from the static spot actual list. Peak/offpeak actuals remain available for later reports but are not used here.

## Forecast Feature

`Forecast` is available in the PeaksModern application. It shows monthly forecast rows with:

```text
Month
MWh
Peak %
```

The feature displays `Peak %` as percent and stores `peak_pct` as decimal. Details are documented in `peaks_modern_forecast_feature.md`.

## UI Entry Point

Run the local tool with:

```bash
npm run hedging:tool
```

Default URL:

```text
http://127.0.0.1:5175/hedging
```

Use `-- --host 0.0.0.0 --port <port>` to expose it on the LAN during local testing.

## Known PoC Limitations

- In-memory database only.
- No authentication or session management.
- No persistence between server restarts.
- Feature authorization is product-context based, not user based.
