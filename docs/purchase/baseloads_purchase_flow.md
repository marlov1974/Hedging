# Baseloads purchase flow

P0016 adds a local web purchase flow for the synthetic Baseloads customer portfolio.

## Purpose

The flow lets the Baseloads portfolio buy a MW quantity for a selected period. A successful purchase creates one `Calloff` and monthly `Transaction` rows for both Baseloads components:

```text
base.sys
base.epad
```

P0055 mirrors the calloff into event details as market-near Baseloads:

```text
MARKET   market.base.<area>
CUSTOMER fee.calloff
```

Baseloads does not create a `modern.base` customer hedge detail by default.

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

## Rebalance Events

P0051 records Baseloads rebalance actions as `REBALANCE` events. The rebalance target is compared with the current open market basis position:

```text
market_delta = target_market_position - current_open_market_position
```

The current open market position is read from active `market.base.<area>` event details when available. Older transaction rows remain a compatibility fallback.

Generated derivative names are assigned to the compatibility transaction rows when the rebalance call-off is created.

## Commercial Fee

`fee.calloff` is configured as a Baseloads product price component.

The generated fee event detail:

```text
leg_type = CUSTOMER
component_code = fee.calloff
quantity_type = MWh
price_type = EUR_PER_MWH
```

The fee quantity is based on absolute customer-facing calloff volume and does not double count the paired `base.sys` and `base.epad` transaction rows in the same calloff. Separate calloffs are charged separately.

## Baseloads To Modern Upgrade

P0055 adds `upgradeBaseloadsToPeaksModern`.

The upgrade runs in two linked calloffs:

```text
<id>-MARKET_REBALANCE
<id>-CUSTOMER_CONVERSION
```

The market rebalance calloff calculates target Modern shape from the forecast percentage, converts it to market base using Q-factors, compares it with the current open `market.base.<area>` position, and trades only the delta.

The customer conversion calloff runs after the market rebalance. It reads the resulting open market base position, calculates effective market price from stored market value divided by volume, creates Modern customer details, and adds configured customer add-ons. It does not trade extra market delta.

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
- Pricing display is intentionally minimal; the core scope is call-off, transaction and event-detail creation.
