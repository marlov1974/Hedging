# Static spot actuals

P0019 adds monthly static spot actuals for immediate settlement-report PoC work.

The values are synthetic and derived from the static `base.sys` derivative monthly reference price. They are not production market data.

## Coverage

The list covers:

- months: `2027-01` through `2029-12`
- price area: `STO`
- reference component: `base.sys`
- currency: `EUR`
- price unit: `EUR/MWh`

The current settlement preparation supports system/base market exposure first. Component-level actuals beyond the system/base exposure are out of scope for this package.

## Fields

Each row contains:

```text
month
price_area
monthly_average_price
peak_price
offpeak_price
currency
price_unit
source_name
source_method
```

## Weighted-average formula

Monthly average is calculated from peak and offpeak prices:

```text
monthly_average_price = (peak_price * peak_h + offpeak_price * offpeak_h) / total_h
```

where:

```text
offpeak_h = total_h - peak_h
```

The calendar hours come from the seeded Swedish trading calendar helper.

## Generation method

For each month:

1. Read the static monthly `base.sys` derivative reference.
2. Apply deterministic peak and offpeak factors.
3. Keep factors within `0.70` to `1.30` of the derivative reference.
4. Calculate monthly average from peak/offpeak using calendar hours.

This makes actuals immediately available in the PoC without external API access or credentials.

## Helper functions

Settlement packages can use:

```text
getMonthlySpotActual(month, priceArea)
getSpotActualsForYear(year, priceArea)
validateSpotActualConsistency(row)
```

## Known limitations

- Static actuals are synthetic PoC data.
- Only `STO` is currently exposed because that is the existing Price API price-area convention.
- The spot actual list is monthly resolution only.
