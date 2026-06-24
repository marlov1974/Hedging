# Currency Component Model

## Purpose

This document defines the PoC currency model for Portfolio Hedging Products.

The model is intentionally generic and sanitized. It uses synthetic examples only.

## Core decision

All power transactions are normalized as EUR-denominated power economics.

Currency is represented as a separate component transaction.

A commercial calloff may be agreed with a SEK price or may include a currency purchase from a market-facing function. The internal model still normalizes the calloff into separate component legs:

```text
1. power component leg in EUR
2. currency component leg for EUR/SEK
```

The currency component is not merely a generic settlement-rate lookup. It represents the currency leg attached to the calloff or purchase group.

## Generic transaction shape

The target normalized transaction shape is:

```text
component_code
period
quantity
quantity_type
price
price_type
factor
factor_type
```

Derived values such as MWh and value should not be stored as source-of-truth transaction fields when they can be calculated deterministically.

## Power transaction semantics

Power component transactions use:

```text
quantity      = MW
quantity_type = MW
price         = EUR/MWh
price_type    = EUR_PER_MWH
factor        = q-factor
factor_type   = Q_FACTOR
```

Examples of power components:

```text
base.sys
base.epad
peak.sys
peak.epad
```

Power value is derived:

```text
hours = resolved_hours(component.hour_basis, period)
mwh = quantity * hours
raw_value_eur = mwh * price
q_value_eur = raw_value_eur * factor
```

Power rows must not store SEK settlement value directly.

## Currency component semantics

Currency component transactions use:

```text
component_code = currency.eursek
quantity       = actual EUR amount covered by the currency leg
quantity_type  = EUR
price          = SEK per EUR
price_type     = SEK_PER_EUR
factor         = null
factor_type    = null
```

The currency component represents the EUR amount that was bought, hedged, converted, or synthetically separated from a SEK commercial calloff.

It is attached to the same calloff or transaction group as the power component rows.

Derived SEK value:

```text
currency_value_sek = quantity * price
```

## Example: SEK commercial calloff normalized into two legs

Commercial statement:

```text
Bought 1200 MWh base.sys for 100000 SEK.
```

Assume:

```text
period = 202701
total_h = 744
fx_rate = 11.25 SEK_PER_EUR
q_factor = 1
```

Derived EUR power value:

```text
power_value_eur = 100000 / 11.25 = 8888.8889 EUR
power_price_eur_per_mwh = 8888.8889 / 1200 = 7.4074 EUR/MWh
power_mw = 1200 / 744 = 1.6129 MW
```

Stored power leg:

```text
component_code = base.sys
period         = 202701
quantity       = 1.6129
quantity_type  = MW
price          = 7.4074
price_type     = EUR_PER_MWH
factor         = 1
factor_type    = Q_FACTOR
```

Stored currency leg:

```text
component_code = currency.eursek
period         = 202701
quantity       = 8888.8889
quantity_type  = EUR
price          = 11.25
price_type     = SEK_PER_EUR
factor         = null
factor_type    = null
```

Derived values:

```text
base.sys mwh       = 1.6129 * 744 = 1200
base.sys value_eur = 1200 * 7.4074 = 8888.8889 EUR
currency value_sek = 8888.8889 * 11.25 = 100000 SEK
```

## Partial currency coverage

The currency component may cover less than, equal to, or more than the derived EUR power value.

Example:

```text
power q_value_eur      = 10000 EUR
currency.eursek amount = 6500 EUR
coverage               = 65 percent
```

The model must not assume that 100 percent of the EUR exposure is always covered by the currency component.

## Portfolio currency

A portfolio should have a currency field.

For the shared demo portfolio, the portfolio currency is:

```text
SEK
```

This means the portfolio/customer-facing settlement or reporting perspective is SEK, while all power component transactions remain EUR-denominated.

## Product configuration

Some product configurations may include currency as a component and some may not.

When currency is included, `currency.eursek` is part of the product configuration and purchase/calloff flow.

When currency is not included, power rows still remain EUR-denominated, but no currency component row is created for the calloff.

## Projection rules

Raw canonical/internal views may show both power rows and currency rows.

Customer-facing SEK views may derive SEK values from the currency rows.

Market power views should not treat currency rows as power exposure.

Currency rows must not be summed as MWh or MW.

## Non-goals

This document does not define real FX sourcing, real market execution, accounting treatment, or external settlement rules.

It only defines the normalized PoC transaction model for separating EUR power economics from currency component economics.
