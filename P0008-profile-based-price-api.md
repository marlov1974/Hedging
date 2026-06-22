# P0008 - Profile based Price API

This package defines the next version of the Price API.

The request should contain a price area and a monthly MW profile.

The response should remain monthly:

```text
month
base.sys
base.epad
currency.sek
```

The algorithm should use available year, quarter and month price blocks.

It should stack year first, quarter second and month last.

Missing quarter or month blocks may be created virtually from wider blocks using documented relation tables.

This is a requirements package, not an implementation package yet.
