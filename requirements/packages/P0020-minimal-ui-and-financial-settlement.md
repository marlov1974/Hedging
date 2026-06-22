# P0020 - Minimal UI and financial settlement feature

## Purpose

Refine the hedging tool UI and add a Financial Settlement feature.

This is a coding package.

## Context

The current UI still contains visual elements that consume space and do not add value to the PoC workflow. This package should make the UI more minimalist and add the first financial settlement report.

P0019 adds static derivative prices and monthly spot actuals. The Financial Settlement feature should use the available static spot actual data and calloff/transaction data.

## UI cleanup

Make the hedging tool UI more minimalist.

Remove objects marked as unnecessary in the latest UI review, including:

```text
large decorative/marketing-style headers
extra selected-portfolio text duplicated outside the portfolio selector
extra open/status card if it is only visual and not functional
unnecessary spacing around the portfolio selector and feature navigation
```

Keep:

```text
compact portfolio selector
compact feature navigation
active feature content
```

Do not remove functionality.

## New feature: Financial Settlement

Add a new feature called:

```text
Financial Settlement
```

The feature works against the selected portfolio.

The user selects a month from a dropdown.

The feature calculates financial settlement for that month.

## Month selector

The month dropdown should be based on available transaction/settlement data where possible.

For the PoC, support months in the seeded/static data range.

Use label format such as:

```text
2027-01
2027-02
```

## Settlement formula

For the selected portfolio and month, calculate settlement for hedged Baseloads exposure where sys and epad are combined.

Formula:

```text
financial_settlement = hedge_volume_mwh * (monthly_spot_price - hedge_price)
```

Where:

```text
hedge_volume_mwh = hedged MWh for the selected month
monthly_spot_price = monthly average spot actual price for the month
hedge_price = volume-weighted hedge price for sys + epad combined
```

## Sys + EPAD combined

For Baseloads transactions, combine:

```text
base.sys
base.epad
```

The combined hedge price should be volume-weighted across both components.

If both components have the same monthly hedge volume, the combined hedge price will normally be:

```text
base.sys price + base.epad price
```

But implement it as volume-weighted aggregation rather than a hard-coded sum.

## Hedge volume

For Baseloads monthly settlement:

```text
hedge_volume_mwh = transaction.mw * calendar.total_h
```

When sys and epad are both present for the same hedge, do not double-count volume.

Use one physical hedge volume for the paired sys+epad exposure.

If implementation needs a rule:

```text
hedge_volume_mwh = max or representative MWh across the paired base.sys/base.epad rows for the month
```

Prefer an explicit helper that groups paired Baseloads component transactions and prevents double counting.

## Spot actual price

Use the static spot actuals from P0019.

For this feature use:

```text
monthly_average_price
```

Do not use peak/offpeak settlement in this feature yet.

Peak/offpeak actuals remain available for later reports.

## Required output

Show a settlement result table with at least:

```text
Month
Hedge volume MWh
Hedge price
Monthly spot price
Settlement
```

Optional but useful:

```text
Calloff id
Derivative name
Component group
```

For this feature, component group can be:

```text
base.sys + base.epad
```

## Sign convention

Use this sign convention:

```text
Settlement = hedge_volume_mwh * (monthly_spot_price - hedge_price)
```

Positive value means spot price is above hedge price.

Document the sign convention in UI/help text or documentation.

## Required implementation

Use existing TypeScript and UI conventions.

Suggested modules, adapt to current structure:

```text
src/hedging/financialSettlement.ts
src/hedging/FinancialSettlementView.*
tests/hedging/financialSettlement.test.ts
```

## Required functions

Add business logic functions separate from UI where practical:

```text
getFinancialSettlementMonths
calculateFinancialSettlementForMonth
combineSysAndEpadHedgePrice
getMonthlySpotActualForSettlement
```

## Tests

Add or update tests for:

1. UI no longer renders decorative/duplicated portfolio marketing objects,
2. compact portfolio selector remains available,
3. feature menu includes Financial Settlement,
4. Financial Settlement renders month dropdown,
5. monthly settlement uses monthly_average_price from spot actuals,
6. sys and epad are combined into one hedge price,
7. sys and epad do not double-count hedge volume,
8. settlement formula equals hedge_volume_mwh * (monthly_spot_price - hedge_price),
9. missing spot actual gives clear error/empty state,
10. missing hedge transactions gives clear empty state,
11. sign convention is stable and documented.

## Documentation

Create or update:

```text
docs/hedging/financial_settlement.md
docs/hedging/hedging_tool_shell.md
```

Document:

```text
minimal UI cleanup
Financial Settlement feature
month selector
sys+epad combined hedge logic
hedge volume calculation
monthly spot actual usage
settlement formula
sign convention
known PoC limitations
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
- UI cleanup completed,
- Financial Settlement feature status,
- formula implemented,
- sys+epad combination logic,
- tests added or updated,
- tests run,
- test result,
- REPOSITORY_FILES.md status.
