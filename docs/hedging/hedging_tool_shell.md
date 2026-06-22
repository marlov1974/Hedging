# Hedging tool shell

P0017 introduced the first local hedging tool shell. P0018 refines it into a compact work surface.

## Portfolio Context

The tool starts with portfolio selection. The selected portfolio becomes the active context for all feature panels.

The compact top selector shows portfolio choices from the synthetic seed database. Once selected, the selected portfolio name remains visible in the top bar.

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

## Feature Navigation

The current features are:

```text
Buy Baseloads
Baseloads Calloff List
Portfolio Details
Position Report
```

Feature availability is evaluated from the active portfolio context. Baseloads features are available only when the selected portfolio is linked to the Baseloads product configuration.

## Minimal Layout

The shell intentionally avoids a large page heading and subtitle. The top area is reserved for compact portfolio context and navigation.

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
