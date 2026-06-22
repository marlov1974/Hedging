# P0004 - Currency component documentation

## Purpose

Document currency as a separate component in the generic model.

This is a documentation package. It does not add prototype code.

## Package type

Documentation package.

## Required work

Create a small documentation file:

```text
currency_component.md
```

If the documentation structure exists, place it under:

```text
docs/components/
```

If the structure does not exist yet, create it in root and move it later.

## Model requirement

Currency must be represented separately from energy and shape components.

Most components should remain denominated in:

```text
EUR/MWh
```

Currency is different because it is money-based, not MW-based.

## Required concepts

The documentation should explain:

- currency is a separate component,
- market-facing instruments may be in local currency,
- energy components should remain comparable in EUR/MWh,
- currency conversion should not be hidden inside other component prices,
- currency has amount, currency pair, rate, source and valuation date,
- currency is not converted through delivery calendars,
- currency is not a MW or MWh component.

## Verification

Confirm that:

- no real organization names are added,
- no real prices or rates are added,
- the file uses only generic terminology,
- `REPOSITORY_FILES.md` is updated if files are added or moved.
