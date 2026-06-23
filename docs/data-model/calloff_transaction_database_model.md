# Calloff and transaction database model

P0014 adds the minimal database structure for storing a customer action and its monthly component rows.

## Calloff

`Calloff` is the parent row for one customer action against a product configuration and customer portfolio.

Fields:

```text
calloff_id
product_id
portfolio_id
date
delivery_start_month
delivery_end_month
```

`product_id` references `Product Configuration`. `portfolio_id` references `Customer Portfolio`. `date` uses `YYYY-MM-DD` and is the creation date. `delivery_start_month` and `delivery_end_month` use `YYYY-MM` and define the delivery period that the call-off applies to.

## Transaction

`Transaction` is a monthly product-component row created by a call-off.

Fields:

```text
transaction_id
calloff_id
month
productcomponent_id
mw
q_factor
```

`calloff_id` references `Calloff`. `productcomponent_id` references `Product Configuration Component`. `month` uses `YYYY-MM` and defines the transaction delivery month.

## Relationships

```text
Product Configuration 1..n Calloff
Customer Portfolio 1..n Calloff
Calloff 1..n Transaction
Product Configuration Component 1..n Transaction
```

A transaction's product component must belong to the same product configuration as the parent call-off.

## Q-factor

`q_factor` is stored on `Transaction` because later Market-facing quantities are derived from the call-off transaction values that were known at transaction time.

The expected later derivation shape is:

```text
market_quantity = mw * q_factor
```

P0014 stores the inputs for that derivation. It does not materialize Market rows or implement the derivation calculation.
