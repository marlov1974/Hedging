# Static derivative price list

P0019 adds a deterministic static derivative price list for PoC use.

P0041 refreshes the annual base levels with public Euronext Nord Pool Power Futures observations and adds annual-to-month distribution keys for static monthly prices.

The list is not production market data or a live market-data cache. It is a small public PoC fixture intended to let the Price API and settlement-report prototypes run without live market access.

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

Annual levels are public Euronext Nord Pool Power Futures quotes snapshot observations for Nordic System Price and Stockholm EPAD annual base-load contracts. Quarterly and monthly blocks are deterministic adjustments from the annual levels.

The annual-to-month distribution key is:

```text
Jan 112%
Feb 108%
Mar 102%
Apr 94%
May 90%
Jun 88%
Jul 91%
Aug 108%
Sep 114%
Oct 103%
Nov 97%
Dec 93%
```

The factors average to 100% over the full year. They are calibrated on the public Nordic System Price base-load snapshot where front month July was about 91% of the annual reference and Q3 was about 104% of the annual reference.

Static-mode `getMonthlyPrices` uses the generated monthly blocks. Fixture mode and providers without monthly blocks still fall back to annual prices.

The source name is:

```text
euronext-public-power-futures-snapshot
```

## Known limitations

- Static prices are PoC-only and are not licensed or validated production prices.
- The `SE3`/`STO` bridge is a prototype convention, not a final price-area model.
- EPAD uses the same monthly distribution key for now even though EPAD can need component-specific shape handling later.
- Static currency rates are deterministic PoC values included only so Price API rows remain complete.
