# Static derivative price list

P0019 adds a deterministic static derivative price list for PoC use.

The list is not production market data. It is synthetic public-safe data intended to let the Price API and settlement-report prototypes run without live market access.

## Provider mode

Static mode is selected with:

```bash
PRICE_PROVIDER_MODE=static
```

The mode uses `StaticDerivativePriceProvider` and `StaticCurrencyProvider`.

Existing modes remain available:

```bash
PRICE_PROVIDER_MODE=fixture
PRICE_PROVIDER_MODE=real
```

## Coverage

The static derivative list covers:

- components: `base.sys`, `base.epad`
- price area: `STO`
- annual blocks: `2027`, `2028`, `2029`, `2030`
- quarterly blocks: `2027-Q1` through `2029-Q3`
- monthly blocks: `2027-01` through `2029-12`
- currency: `EUR`
- price unit: `EUR/MWh`

The repository seed portfolios currently use `SE3`, while the Price API type currently supports `STO`. P0019 keeps the existing Price API convention and treats `STO` as the static PoC bridge for seeded `SE3` portfolio examples.

## Normalized fields

Every derivative block uses the normalized provider shape:

```text
component
price_area
block_type
block_id
start_month
end_month
price
currency
price_unit
retrieved_at
source_name
source_instrument
```

## Generation method

Annual levels are deterministic synthetic values. Quarterly and monthly blocks are deterministic adjustments from the annual levels.

The source name is:

```text
synthetic-static-derivative-poc
```

## Known limitations

- Static prices are PoC-only and are not licensed or validated production prices.
- The `SE3`/`STO` bridge is a prototype convention, not a final price-area model.
- Static currency rates are deterministic PoC values included only so Price API rows remain complete.
