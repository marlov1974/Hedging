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

## Allocation Peak

`allocation.peak.sys` and `allocation.peak.epad` are visible to customer and internal projections because they explain the customer peak-hour allocation.

They are not visible to markets because they are category `allocation` and have q-factor `0`.

They normally carry the same MW and must not be summed as physical customer volume. Deprecated `allocation.peak` rows may be read as a compatibility alias when old fixture rows remain.
