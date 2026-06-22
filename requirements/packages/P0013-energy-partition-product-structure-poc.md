# P0013 - Energy partition product structure PoC

## Purpose

Build the first peak-handling product-structure proof of concept: the energy partition model.

This is a coding package.

## Background

This PoC represents the process-owner model.

In this model, customer energy is partitioned between time blocks. The energy used during peak hours belongs to the peak part of the product structure. The energy used during offpeak hours belongs to the offpeak/base part of the product structure.

This package intentionally does not implement the alternative base-plus-shape-exposure model. That will be a later package.

## Key modelling principle

`base.sys` and `base.epad` have two variants depending on product configuration context.

### Variant 1: Baseload products

When `base.sys` and `base.epad` belong to baseload products, they represent the customer's total consumption.

```text
base.sys = system component for total customer consumption
base.epad = area component for total customer consumption
```

### Variant 2: Complex peak/profile products

When `base.sys` and `base.epad` belong to more complex products, they represent the average offpeak effect spread across the full month.

```text
base.sys = system component for offpeak average power spread over all month hours
base.epad = area component for offpeak average power spread over all month hours
```

In this variant, the peak component owns the customer's peak-hour energy.

## Required data model addition

Add an explicit context or variant field so a product component can state how its quantity should be interpreted.

Suggested field name:

```text
quantity_semantics
```

Allowed values for this package:

```text
total_consumption
offpeak_average_spread_over_month
peak_energy
```

Apply this to product configuration components or an equivalent structure that fits the existing code.

## Required calculation behavior

For a monthly input:

```text
month
offpeak_mw
peak_mw
offpeak_hours
peak_hours
base_sys_price
base_epad_price
peak_price
```

Calculate energy partition output:

```text
offpeak_mwh = offpeak_mw * offpeak_hours
peak_mwh = peak_mw * peak_hours
total_mwh = offpeak_mwh + peak_mwh
```

For complex peak/profile products:

```text
base_month_mw = offpeak_mw
base_month_mwh = offpeak_mw * (offpeak_hours + peak_hours)
peak_mwh = peak_mw * peak_hours
```

Important: in this PoC, peak-hour customer energy belongs to the peak component for settlement/product-structure purposes.

## Value calculation

Use these components:

```text
base.sys
base.epad
profile.peak
```

For the first PoC, it is acceptable to combine base.sys and base.epad into a base all-in price in calculation output, but keep the components separate in data structures.

Expected value shape:

```text
base_value = base_month_mwh * (base.sys + base.epad)
peak_value = peak_mwh * profile.peak
```

Also calculate customer settlement projection:

```text
offpeak_value = offpeak_mwh * offpeak_price
peak_value = peak_mwh * peak_price
total_value = offpeak_value + peak_value
```

The implementation must make clear whether the view is component-value or settlement-value.

## Required output

Add a function that returns a transparent monthly explanation:

```text
month
model_name
product_configuration
component_rows
settlement_rows
total_mwh
total_value
average_price
warnings
```

Component rows should include:

```text
component
quantity_semantics
mw
mwh
price
value
```

Settlement rows should include:

```text
time_block
mw
hours
mwh
price
value
```

## Required tests

Add tests for:

1. baseload product: base.sys/base.epad represent total customer consumption,
2. complex product: base.sys/base.epad use `offpeak_average_spread_over_month`,
3. complex product: peak component uses `peak_energy`,
4. offpeak_mw = 1, peak_mw = 1, offpeak_hours = 424, peak_hours = 320,
5. offpeak/peak settlement value equals 72320 when offpeak price is 80 and peak price is 120,
6. component rows expose quantity semantics,
7. component view and settlement view are not silently mixed,
8. no hidden double counting in settlement rows.

## Documentation

Create:

```text
docs/peak-models/energy_partition_product_structure.md
```

Document:

```text
purpose of the model
base.sys/base.epad variant semantics
how peak owns peak-hour customer energy
component view vs settlement view
known strengths
known weaknesses
```

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

Update `REPOSITORY_FILES.md` to match `git ls-files`.

## Completion report

Report:

- files changed,
- product/component semantics implemented,
- tests added,
- tests run,
- test result,
- numeric result for the 80/120 example,
- known modelling limitations,
- REPOSITORY_FILES.md status.
