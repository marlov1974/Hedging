# Component Categories And Projection Listeners

## Categories

```text
allocation
base
peak
profile
volume
currency
adjustment
```

Each configured product component has a category and hour basis.

## Projection Listeners

Customer projections include customer-relevant components:

```text
allocation
base
peak
profile
volume
currency
```

Customer projections exclude `adjustment`.

Market projection includes:

```text
base
peak
profile
```

Market projection ignores `allocation`, `currency`, `volume` and `adjustment` in this PoC.

Internal projection includes all components.

## allocation.peak

`allocation.peak` is visible to customer and internal projections because it explains the customer peak-hour allocation.

It is not visible to markets because it is category `allocation` and has q-factor `0`.
