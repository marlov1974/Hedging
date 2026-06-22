# Price API v2 stacking

V2 should build monthly component prices by stacking available blocks against the requested MW profile.

## Stacking order

```text
year
quarter
month
```

## Principle

The widest available block is used first.

The remaining profile shape is then covered by narrower blocks.

## Monthly price

The monthly price is the volume-weighted average of the blocks used for that month.

For a month, the calculation should be traceable to:

```text
month
component
source_block_type
source_block_id
block_price
block_mw_used
```

## Output

The compact response remains:

```text
month
base.sys
base.epad
currency.sek
```
