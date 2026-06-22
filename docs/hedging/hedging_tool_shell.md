# Hedging tool shell

P0017 introduces the first local hedging tool shell.

## Portfolio Context

The tool starts with portfolio selection. The selected portfolio becomes the active context for all feature panels.

The selector shows portfolio choices from the synthetic seed database. Once selected, the UI displays:

```text
portfolio name
customer name
customer number
price area
product configuration name
```

If no portfolio is selected, the feature area asks the user to select a portfolio first.

## Feature Navigation

The initial features are:

```text
Buy Baseloads
Baseloads Calloff List
```

Feature availability is evaluated from the active portfolio context. Baseloads features are available only when the selected portfolio is linked to the Baseloads product configuration.

## Baseloads Purchase Feature

The shell reuses the P0016 Baseloads purchase business logic. A successful purchase creates:

```text
one Calloff
monthly base.sys Transactions
monthly base.epad Transactions
```

The shell does not duplicate transaction construction. It delegates to `purchaseBaseloads`.

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
