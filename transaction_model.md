# Transaction model

A transaction is a monthly component row under a call-off.

## Purpose

Transactions describe how a call-off is decomposed by delivery month and component.

There is normally one transaction per month and component.

## Core fields

```text
transaction_id
calloff_id
delivery_month
component_code
quantity
quantity_unit
price
price_unit
calendar_basis
derived_mwh
```

## Component examples

```text
base.sys
base.epad
profile.peak
profile.15m
volume
volume.flex
fixed
```

## Rule

Transaction rows may share a volume basis. They must not be summed as physical volume unless explicitly defined as volume-owning rows.

Settlement values are expressed in MWh.
