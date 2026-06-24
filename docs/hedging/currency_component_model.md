# Currency Component Model

P0041 adds a normalized currency layer to the PoC.

## Core Rule

Power transactions remain EUR-denominated power economics:

```text
quantity_type = MW
price_type = EUR_PER_MWH
factor_type = Q_FACTOR
```

Currency is represented as a separate component transaction:

```text
component_code = currency.eursek
component_category = currency
quantity_type = EUR
price_type = SEK_PER_EUR
factor_type = null
```

## Portfolio Currency

Portfolio currency is the customer-facing/reporting currency. The shared demo seed data uses:

```text
portfolio.currency = SEK
```

Compatibility behavior: older portfolio inserts that omit currency default to `EUR`.

## SEK Commercial Normalization

A SEK commercial calloff is normalized into:

```text
1. EUR power component rows
2. currency.eursek row
```

Example:

```text
1200 MWh for 100000 SEK
fx_rate = 11.25 SEK_PER_EUR
total_h = 744
```

Power row:

```text
quantity = 1.612903 MW
price = 7.407407 EUR_PER_MWH
factor = 1 Q_FACTOR
```

Currency row:

```text
quantity = 8888.888889 EUR
price = 11.25 SEK_PER_EUR
```

The currency row may cover less than, equal to, or more than the EUR power value.

## Projection Rules

`currency.eursek` is not a MW/MWh component and must not be included as market power exposure.

Raw/internal views may show the currency row. Customer SEK views can derive:

```text
currency_value_sek = quantity_eur * sek_per_eur
```

## P0042 View Usage

Views derive `value_eur`, `q_value_eur`, `value_sek` and `coverage_pct` from normalized rows. `currency.eursek` remains a currency component in raw, Classic and Modern projected views and is used as the traded FX source for SEK display values.

## P0043 Projected Model Usage

Classic and Modern reports use `currency.eursek` rows carried through the projected model input. The row supplies EUR coverage quantity and `SEK_PER_EUR` price for display values. It is not converted into `classic.*` or `modern.*` power rows and is never included in MW/MWh exposure.
