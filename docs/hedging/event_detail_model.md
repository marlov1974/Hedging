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
```

Future event types such as adjustment, correction, cancellation and settlement are reserved but not implemented as business flows.

## Event Detail

An event detail is the component-shaped source row:

```text
event_detail_id
event_id
component_code
period
price_area
quantity
quantity_type
price
price_type
factor
factor_type
```

Forecast details normally store `quantity_type = MWh` and leave price/factor fields null.

Purchase details mirror normalized purchase economics from the compatibility transaction rows. Power rows normally use `quantity_type = MW`. Currency rows use `quantity_type = EUR` and `price_type = SEK_PER_EUR`.

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

SYS purchases are recorded per price area:

```text
base.sys price_area = STO
base.sys price_area = MAL
base.sys price_area = LUL
base.sys price_area = SUN
```

Area purchase details use explicit area components such as `base.sto` and `peak.sto`.

`base.epad`, `peak.epad` and `allocation.peak.epad` remain compatibility transaction components until a later package migrates purchase storage fully.
