# Price API v2 profile request

V2 changes the request from start and end month to a monthly MW profile.

## Request

```json
{
  "price_area": "STO",
  "profile": [
    { "month": "2027-01", "mw": 10.0 },
    { "month": "2027-02", "mw": 12.0 }
  ]
}
```

## Rules

- `price_area` is required.
- `profile` must contain one row per requested month.
- Each profile row has `month` and `mw`.
- Month format is `YYYY-MM`.
- Profile quantities are in MW.
- The response remains monthly.
