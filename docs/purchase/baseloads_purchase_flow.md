# Baseloads purchase flow

P0016 adds a local web purchase flow for the synthetic Baseloads customer portfolio.

## Purpose

The flow lets the Baseloads portfolio buy a MW quantity for a selected period. A successful purchase creates one `Calloff` and monthly `Transaction` rows for both Baseloads components:

```text
base.sys
base.epad
```

## Period Options

The dropdown is deterministic:

```text
4 full years
11 quarters
6 months
```

Each option carries:

```text
period_type
start_month
end_month
label
```

The current PoC options start at 2027. P0015 seed data covers 2027-01 through 2029-12, so periods outside that seed range fail at purchase time if required Q-factor values are missing.

## Calloff Creation

The purchase creates exactly one call-off:

```text
calloff_id
product_id
portfolio_id
date
```

`product_id` points to `Baseloads`. `portfolio_id` must be the Baseloads portfolio. Tests inject a deterministic date.

## Transaction Creation

Each delivery month creates two transaction rows:

```text
base.sys
base.epad
```

The same MW quantity is written to both component rows.

Transaction counts:

```text
month = 2 transactions
quarter = 6 transactions
year = 24 transactions
```

A quarter has three months and Baseloads has two components, so a quarter creates:

```text
3 months * 2 components = 6 transactions
```

## Q-factor Read

For each portfolio/product component/month, the purchase logic reads:

```text
PortfolioProductComponent -> QFactorSet -> QFactorValue
```

For Baseloads seed data, `base.sys` and `base.epad` have Q-factor `1.0`.

## UI Entry Point

Run the local web flow with:

```bash
npm run purchase:baseloads
```

The server listens on:

```text
http://127.0.0.1:5174/purchase/baseloads
```

Use `-- --port <port>` to select another port.

## PoC Limitations

- No authentication or sessions.
- In-memory database only.
- No production deployment flow.
- Pricing display is intentionally minimal; the core scope is call-off and transaction creation.
