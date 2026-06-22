# Customer product database structure

The prototype database layer stores generic customer, portfolio, forecast, calendar, product configuration and price component records.

## Customer and portfolio

`Customer` stores the technical customer key, display name and external customer number. The customer number is unique.

`Customer Portfolio` links a customer to a named portfolio, price area and calendar. The portfolio repeats the customer number for convenient lookup, but it must match the linked customer.

`Customer Forecast` stores one monthly forecast row per portfolio and month. Forecast rows use `YYYY-MM`, monthly MWh and a peak share.

## Calendar

`Calendar` stores month-level total hours and peak hours. Peak hours must not exceed total hours.

## Product configuration

`Product Configuration` stores the standard configuration name.

`Product Configuration Component` stores configured component rows such as `base.sys`, `base.epad`, `profile.peak`, `profile.15m` and `currency.sek`.

`Price Component` stores numeric component prices and a required currency for each product configuration component.

## Relationships

```text
Customer 1..n Customer Portfolio
Customer Portfolio 1..n Customer Forecast
Customer Portfolio n..1 Calendar
Product Configuration 1..n Product Configuration Component
Product Configuration Component 1..n Price Component
```
