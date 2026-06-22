# P0012 - Peak model comparison PoC

## Purpose

Build two parallel proof-of-concept calculation models for peak handling.

The purpose is to compare consequences, not to decide the final model in code.

This is a coding package.

## Background

There are two candidate models for how peak should carry volume.

Both models agree that peak can have volume or effect.

The disagreement is what that volume means.

## Model A: Energy partition model

In this model, customer energy is partitioned between time blocks.

```text
offpeak energy belongs to offpeak/base component
peak energy belongs to peak component
```

Peak carries the customer's actual energy during peak hours.

This is close to a historical time-block market view and may be intuitive for settlement and reporting.

## Model B: Base plus shape exposure model

In this model, the customer's full energy need is represented in base.

Peak carries a shape exposure volume, not a physical subset of customer energy.

```text
base = customer's total energy need
peak = shape exposure relative to base
```

This is intended to separate total energy need from profile or shape risk.

## Required implementation

Add a comparison module that can run both models for the same input.

Suggested files, adapt to existing conventions:

```text
src/peak-models/types.ts
src/peak-models/energyPartitionModel.ts
src/peak-models/baseShapeExposureModel.ts
src/peak-models/comparePeakModels.ts
tests/peak-models/peakModelComparison.test.ts
```

## Input

Use a simple monthly input:

```text
month
peak_hours
offpeak_hours
offpeak_mw
peak_mw
offpeak_price
peak_price
```

For Model B, also derive or accept:

```text
base_mwh
base_average_mw
shape_peak_mwh
shape_peak_mw
```

## Required output

For each model, output:

```text
model_name
month
total_mwh
total_value
average_price
base_mwh
peak_mwh
base_value
peak_value
explanation
```

Also output a comparison object:

```text
same_total_mwh
same_total_value
value_difference
interpretation
```

## Test fixture

Add at least this test fixture:

```text
month = 2027-01
base/offpeak price = 80
peak price = 120
offpeak_mw = 1
peak_mw = 1
peak_hours = 320
offpeak_hours = 424
```

Expected Model A:

```text
offpeak_mwh = 424
peak_mwh = 320
total_mwh = 744
total_value = 72320
average_price = 97.2043010753
```

Expected Model B, if base carries total energy:

```text
total_mwh = 744
base_mwh = 744
shape_peak_mwh = 0 when peak_mw equals offpeak_mw
```

The test should show explicitly that Model A and Model B do not necessarily allocate value the same way.

## Additional test fixture

Add a second fixture where peak differs from offpeak:

```text
offpeak_mw = 1
peak_mw = 2
peak_hours = 320
offpeak_hours = 424
offpeak_price = 80
peak_price = 120
```

Use this to show how shape exposure appears in Model B.

## Rules

- Do not make one model implicitly win.
- Use neutral naming in code and documentation.
- Keep both model calculations transparent.
- Avoid hidden double counting.
- Make units explicit: MW, MWh, currency value.

## Documentation

Create:

```text
docs/peak-models/peak_model_comparison.md
```

Document:

```text
what Model A means
what Model B means
what each model is good at
where each model risks confusion
how to interpret the comparison output
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
- formulas implemented,
- test fixtures added,
- tests run,
- test result,
- key numeric comparison from both fixtures,
- `REPOSITORY_FILES.md` status.
