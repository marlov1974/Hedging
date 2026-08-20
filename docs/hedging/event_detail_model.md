# Event Detail Model

P0044 introduces generic source-of-truth vocabulary:

```text
event
event_detail
```

The existing calloff/transaction tables remain as compatibility views in this package.

## Event

An event represents a versioned portfolio model occurrence:

```text
event_id
portfolio_id
event_type
version
created_at
created_order
source
status
```

Supported event types in this package:

```text
FORECAST
PURCHASE
REBALANCE
```

Future event types such as adjustment, correction, cancellation and settlement are reserved but not implemented as business flows.

## Event Detail

An event detail is the component-shaped source row:

```text
event_detail_id
event_id
leg_type
component_code
period
price_area
quantity
quantity_type
price
price_type
factor
factor_type
reason
linked_detail_id
```

P0047 adds leg-aware event details. Supported leg types are:

```text
CUSTOMER
MARKET
```

`CUSTOMER` rows represent the customer/product-facing transaction leg. `MARKET` rows represent the market, risk and settlement leg in the customer's portfolio. Both leg types can share one `event_id`, and `linked_detail_id` can explicitly connect a related customer detail and market detail.

For `ADJUSTMENT` market-only events, `linked_detail_id` may reference the original customer detail in the source purchase event. This keeps the customer commercial row unchanged while allowing the adjustment market delta to point back to the customer basis it was recalculated from.

P0048 makes Modern the customer canonical basis for purchase customer legs:

```text
modern.base
modern.peak
```

Modern customer leg rows store customer-facing energy as `quantity_type = MWh`. Classic input is converted to Modern before customer leg storage. Baseloads input creates `modern.base` and omits `modern.peak` when the peak quantity is zero.

P0049 makes Market bases the canonical market leg basis for purchase details:

```text
market.base.<area>
```

Market basis rows are `MARKET` event details. They store signed `MWh` quantity, the factor used at decision time and a value-preserving market price:

```text
market_quantity = customer_quantity * factor
market_price = customer_price / factor
```

Forecast power details store `quantity_type = MW` and leave price/factor fields null. Forecast MWh is derived from component hour basis and calendar hours:

```text
base.<area> MWh = MW * total_h
peak.<area> MWh = MW * peak_h
```

Purchase details mirror normalized purchase economics from the compatibility transaction rows. Power rows normally use `quantity_type = MW`. Currency rows use `quantity_type = EUR` and `price_type = SEK_PER_EUR`.

Existing compatibility inserts that do not provide a leg type are stored as `MARKET` details. This preserves current forecast, purchase, reporting and settlement behavior until later target-model packages migrate customer canonical storage.

## Forecast Events

Forecast is a `FORECAST` event. It is not a purchase and not an initial calloff.

The seed model stores forecast details by explicit price area:

```text
base.sto
base.mal
base.lul
base.sun
peak.sto
peak.mal
peak.lul
peak.sun
```

Generic EPAD rows are not stored as new forecast event details. SYS forecast values are derived by aggregating area rows.

## Purchase Events

Hedge Forecast accept still creates compatibility calloff/transaction rows and also creates a `PURCHASE` event.

Percent-of-forecast SYS purchases are recorded with the selected price area:

```text
base.sys price_area = STO
```

Area purchase details use explicit area components such as `base.sto` and `peak.sto` for the selected area.

`base.epad`, `peak.epad` and `allocation.peak.epad` remain compatibility transaction components until a later package migrates purchase storage fully.

## Rebalance Events

P0051 records rebalance/product-change actions as `REBALANCE` events. Rebalance events do not rewrite historical purchase events.

The market delta rule is:

```text
market_delta = target_market_position - current_open_market_position
```

Current open market position is read from active `market.base.<area>` market leg event details. Compatibility transaction rows are used only when older data has no market basis event details.

Baseloads rebalance keeps compatibility calloff/transaction rows for existing UI/report paths, but the canonical event mirror uses:

```text
event_id = EVT:REBALANCE:<calloff_id>
event_type = REBALANCE
```

## Market-Only Adjustment Events

P0052 records factor-only market changes as `ADJUSTMENT` events. These events create no new customer leg and do not change the customer commercial position.

The adjustment rule is:

```text
target_market_basis = existing_customer_quantity * new_factor
market_delta = target_market_basis - current_open_market_basis
```

Adjustment market details use:

```text
leg_type = MARKET
component_code = market.base.<area>
reason = Q_FACTOR_UPDATE or PROFILE_FACTOR_UPDATE
factor = factor used for the adjustment target
```

`factor_type` is `Q_FACTOR` for Q-factor changes and `PROFILE_FACTOR` for profile-factor changes. Open market-only adjustment rows are included in the default Baseloads downgrade/projection policy unless a later package adds explicit waiver handling.
