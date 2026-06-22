# Currency component

Currency is a separate component in the model.

## Principle

Energy and shape components should normally be represented in:

```text
EUR/MWh
```

Currency is different. It is money-based, not MW-based.

## Why separate currency

Market-facing instruments may be denominated in a local currency.

The model should still keep other component prices comparable in EUR/MWh.

Currency conversion should therefore be represented as its own component instead of being hidden inside `base`, `peak`, `profile` or `volume` prices.

## Currency component fields

```text
currency_component_id
calloff_id
transaction_id
source_currency
target_currency
currency_pair
rate
rate_source
valuation_date
amount_source
amount_target
```

## Rules

- Currency is not converted through delivery calendars.
- Currency does not have MW or MWh quantity.
- Currency should not change the energy volume.
- Currency should be traceable separately from energy, shape and risk components.
