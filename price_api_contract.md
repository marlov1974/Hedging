# Price API contract

The Price API returns monthly component prices for a requested month range.

## Request

```json
{
  "start_month": "2027-01",
  "end_month": "2027-12"
}
```

`start_month` and `end_month` are inclusive.

## Response

```json
{
  "base_currency": "EUR",
  "price_unit": "EUR/MWh",
  "rows": [
    {
      "month": "2027-01",
      "base.sys": 0.0,
      "base.epad": 0.0,
      "currency.sek": 0.0
    }
  ]
}
```

## Rules

- Return one row per month.
- `base.sys` is returned in EUR/MWh.
- `base.epad` is returned in EUR/MWh.
- `currency.sek` is a separate currency component.
- The base currency is EUR.
- The currency component is SEK.
- Currency must not be embedded in the component prices.
- Example numeric values are synthetic placeholders.
