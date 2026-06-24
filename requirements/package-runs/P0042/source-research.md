# P0042 source research

## Source checked

Euronext Live, Power Derivatives - Euronext Nord Pool Power Futures:

```text
https://live.euronext.com/en/products/commodities/power-derivatives
```

Euronext Live, Power Derivatives Contracts / Quotes snapshot:

```text
https://live.euronext.com/en/products/commodities/power-derivatives/contracts-list
```

## Public page findings

The public product page describes Euronext Nord Pool Power Futures as a dedicated Nordic and Baltic power futures market.

It states that the futures cover industry-standard maturities on Nordic System Price and Electricity Price Area Differential (EPAD) contracts for Nordic and Baltic regions.

The page also states that Euronext acquired Nasdaq's Nordic power futures business and integrated the open positions into Euronext Clearing.

## Snapshot endpoint used for feasibility

The quotes page includes frontend settings for:

```text
Nordic System Price Electricity Base Load
Nordic EPAD Electricity Base Load - Sweden STO
```

The page frontend calls:

```text
POST /en/ajax/featured_derivatives_contracts/get_block_content
```

with the page's `featured_derivatives_contracts` block configuration.

## Observed month, quarter and year relationship

On 2026-06-24, the Euronext contracts page rendered the following public snapshot rows for Nordic System Price Electricity Base Load:

```text
Month NSBM Jul 2026 SETTL 41.68
Quarter NSBQ Q3 2026 SETTL 47.75
Year NSBY 2027 SETTL 45.73
```

Observed ratios against the public annual reference:

```text
Jul front month / year = 41.68 / 45.73 = 91.14%
Q3 front quarter / year = 47.75 / 45.73 = 104.42%
```

The page also rendered Stockholm EPAD base-load rows:

```text
Month STBM Jul 2026 SETTL -3.12
Quarter STBQ Q3 2026 SETTL -5.00
Year STBY 2027 SETTL -2.20
```

EPAD values can be negative and are area differentials, so a single percentage key is calibrated primarily on the system base-load relationship. EPAD uses the same PoC key for now to keep the API simple; a later package can introduce component-specific EPAD shape keys if needed.

## Annual-to-month distribution key

P0042 adds these 12 schablon factors. They average to 100% over the year and set Q3 close to the observed Euronext Q3/year relationship while keeping July close to the observed front-month/year relationship:

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

The resulting Q3 average is 104.33%, close to the observed 104.42%.

## Observed settlement reference

On 2026-06-24, the public snapshot returned settlement observations for the 2027-2030 annual System Price and Stockholm EPAD contracts.

The implementation stores the small public settlement observations used by the PoC fixture:

```text
2027 base.sys 45.73, base.epad -2.20
2028 base.sys 43.10, base.epad -0.35
2029 base.sys 42.90, base.epad -0.60
2030 base.sys 45.35, base.epad 1.10
```

A later refetch of the AJAX endpoint during the same package returned Euronext's generic 500 error page even for the original block payload, so the committed values remain the verified public snapshot observations captured earlier in the run.

## Boundary

These are not production prices, a market-data cache or trading inputs. They are public PoC fixture observations used to avoid unrealistic manual-looking test/demo prices. Customer-specific prices, agreed adders and private commercial terms remain excluded.
