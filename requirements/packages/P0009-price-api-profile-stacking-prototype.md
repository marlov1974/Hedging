# P0009 - Price API profile stacking prototype

## Purpose

Implement the profile-based Price API version on top of the P0007 Price API prototype.

This is a coding package.

## Prerequisites

P0007 must be complete and tests should pass before starting.

Read:

```text
README.md
AGENTS.md
memory/bootstrap-manifest.json
REPOSITORY_FILES.md
requirements/packages/P0007-price-api-prototype.md
P0008-profile-based-price-api.md
price_api_v2_profile_request.md
price_api_v2_stacking.md
price_api_v2_virtual_blocks.md
```

If any P0008 files have already been moved into `docs/price-api/`, read them from there instead.

## Scope

Add a v2 Price API function or endpoint that accepts:

```json
{
  "price_area": "STO",
  "profile": [
    { "month": "2027-01", "mw": 10.0 },
    { "month": "2027-02", "mw": 12.0 }
  ]
}
```

The response remains monthly:

```json
{
  "base_currency": "EUR",
  "price_unit": "EUR/MWh",
  "rows": [
    {
      "month": "2027-01",
      "base.sys": 0.0,
      "base.epad": 0.0,
      "currency.sek": 0.0
    }
  ]
}
```

## Required components

Implement or extend TypeScript modules for:

```text
profile request validation
block price provider fixtures
virtual block generation
block stacking
monthly weighted average price calculation
optional calculation trace model
```

Use existing P0007 conventions where possible.

## Data model

Use synthetic fixture data only.

Support these block types:

```text
year
quarter
month
```

Support these components:

```text
base.sys
base.epad
currency.sek
```

Support at least this price area:

```text
STO
```

## Stacking algorithm

For each component except `currency.sek`:

1. Build the monthly MW target profile.
2. Use year blocks first.
3. Use quarter blocks second.
4. Use month blocks last.
5. For each month, calculate the price as weighted average of all source blocks used for that month.

For v2, `currency.sek` may be repeated monthly from fixture data and must remain separate from energy component prices.

## Virtual blocks

If a quarter or month block is missing, create virtual blocks from wider available blocks.

Quarter from year:

```text
Q1 = 135% of annual price
Q2 = 75% of annual price
Q3 = 80% of annual price
Q4 = 110% of annual price
```

Month distribution inside quarter:

```text
Q1: Jan 38%, Feb 37%, Mar 25%
Q2: Apr 40%, May 32%, Jun 28%
Q3: Jul 25%, Aug 33%, Sep 42%
Q4: Oct 28%, Nov 34%, Dec 38%
```

Virtual blocks must carry:

```text
virtual = true
virtual_rule_id
source_block_id
```

Direct source blocks must carry:

```text
virtual = false
```

## Validation rules

Reject:

- missing price area,
- unsupported price area,
- empty profile,
- invalid month format,
- duplicate months,
- non-contiguous month profile,
- missing MW,
- missing fixture data that cannot be virtualized.

For this package, reject negative MW unless existing design already explicitly supports it.

## Trace requirement

The compact response remains unchanged.

Internally, support a trace structure for each month and component:

```text
month
component
source_block_type
source_block_id
block_price
block_mw_used
virtual
virtual_rule_id
```

It is acceptable to expose trace through a separate function rather than the main endpoint.

## Tests

Add tests for:

1. flat annual profile returns monthly rows,
2. full-year profile returns 12 rows,
3. profile requiring annual plus quarterly layers,
4. profile requiring annual plus quarterly plus monthly layers,
5. missing quarter created virtually from year,
6. missing month created virtually from quarter,
7. weighted average uses multiple blocks in one month,
8. unsupported price area rejected,
9. duplicate month rejected,
10. non-contiguous profile rejected,
11. negative MW rejected,
12. `currency.sek` remains separate from `base.sys` and `base.epad`,
13. virtual blocks are marked as virtual in trace.

## Documentation cleanup

Move P0008 files into the standard structure if they are still in root:

```text
P0008-profile-based-price-api.md -> requirements/packages/P0008-profile-based-price-api.md
price_api_v2_profile_request.md -> docs/price-api/price_api_v2_profile_request.md
price_api_v2_stacking.md -> docs/price-api/price_api_v2_stacking.md
price_api_v2_virtual_blocks.md -> docs/price-api/price_api_v2_virtual_blocks.md
```

Update `REPOSITORY_FILES.md` to match `git ls-files`.

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

## Completion report

Report:

- files changed,
- tests run,
- test result,
- new v2 entry point,
- trace support status,
- assumptions,
- `REPOSITORY_FILES.md` status.
