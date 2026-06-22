# Price API monthly output

The API converts available annual prices into monthly rows.

## V1 rule

V1 supports annual derivatives only.

For every month inside a supported year, the same annual price is returned for that component.

Example:

```text
2027 annual base.sys price -> every month from 2027-01 to 2027-12
2027 annual base.epad price -> every month from 2027-01 to 2027-12
```

## Output columns

```text
month
base.sys
base.epad
currency_rate
```

## Missing data

If a month cannot be priced, the API must return an explicit missing-data status rather than silently returning zero.

## Rule

Zero is a valid price only if the source explicitly provides zero.
