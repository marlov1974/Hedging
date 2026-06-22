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
  "currency": "EUR",
  "price_unit": "EUR/MWh",
  "rows": [
    {
      "month": "2027-01",
      "base.sys": 0.0,
      "base.epad": 0.0,
      "currency_rate": 0.0
    }
  ]
}
```

## Rules

- Return one row per month.
- `base.sys` is returned in EUR/MWh.
- `base.epad` is returned in EUR/MWh.
- `currency_rate` is a separate value.
- Currency must not be embedded in the component prices.
- Example numeric values are synthetic placeholders.
