# Financial Settlement

P0020 adds the first monthly financial settlement report to the hedging tool.

The report is a PoC feature for Baseloads hedges. It uses synthetic in-memory hedge transactions and P0019 static monthly spot actuals.

## Month Selector

The feature provides a month dropdown using the seeded/static range:

```text
2027-01 through 2029-12
```

The selected month controls the settlement rows shown for the active portfolio.

## Baseloads Component Group

Baseloads settlement combines:

```text
base.sys + base.epad
```

The report does not show separate financial settlement rows for sys and epad. The paired component transactions are grouped into one hedge exposure.

## Hedge Volume

Component transaction MWh is calculated as:

```text
transaction.mw * calendar.total_h
```

For the paired `base.sys` and `base.epad` rows, hedge volume is represented once. The implementation uses the representative paired volume instead of summing both component MWh values, so physical hedge volume is not double-counted.

## Hedge Price

The combined hedge price is volume-weighted across the sys and epad component rows:

```text
hedge_price = weighted sys+epad component value / representative hedge volume
```

When sys and epad have the same volume, the combined price normally equals:

```text
base.sys price + base.epad price
```

The implementation still calculates it through weighted aggregation rather than hard-coding the sum.

## Spot Actual

P0020 uses:

```text
monthly_average_price
```

from the P0019 static spot actual list.

Peak and offpeak actuals are intentionally not used in this feature yet.

## Formula

Financial settlement is calculated as:

```text
financial_settlement = hedge_volume_mwh * (monthly_spot_price - hedge_price)
```

Positive value means spot price is above hedge price.

## Known PoC Limitations

- Baseloads only.
- Uses static synthetic spot actuals.
- Uses the P0019 `STO` static price-area bridge while seeded portfolios currently use `SE3`.
- In-memory transactions only.
