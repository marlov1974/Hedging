# P0016 - Baseloads purchase flow

## Purpose

Build a simple but professional web purchase flow for Baseloads customers.

The flow lets a Baseloads customer buy a power quantity for a selected period. The purchase creates one Calloff and monthly Transaction rows for both `base.sys` and `base.epad`.

This is a coding package.

## Context

Earlier packages created customer, product, portfolio, calloff and transaction structures.

This package adds a user-facing purchase flow for the `Baseloads` product configuration.

## Scope

Create a web UI for Baseloads purchase.

The UI should support:

```text
customer/portfolio selection limited to the Baseloads customer/portfolio
a MW input
period selection from a dropdown
purchase/confirm action
post-purchase result view
```

The visual design should be simple, clean and professional. It does not need to be a production UI.

## Period dropdown

The period dropdown must contain:

```text
4 full years
11 quarters
6 months
```

The options should be deterministic and based on available fixture/seed data if possible.

Use labels that are clear for a business user, for example:

```text
Year 2027
Q1 2027
Jan 2027
```

Each option must carry:

```text
period_type: year | quarter | month
start_month
end_month
label
```

## Baseloads components

A Baseloads purchase always buys both components together:

```text
base.sys
base.epad
```

The same MW quantity is applied to both components.

## Calloff creation

When the user confirms a purchase, create exactly one Calloff:

```text
calloff_id
product_id
portfolio_id
date
```

Rules:

- `product_id` must point to `Baseloads`.
- `portfolio_id` must point to the Baseloads customer portfolio.
- `date` is the current date or a deterministic injected date in tests.

## Transaction creation

Create one Transaction per month and product component.

For Baseloads, there are two product components:

```text
base.sys
base.epad
```

Therefore:

```text
month period = 1 month -> 2 transactions
a quarter = 3 months -> 6 transactions
a year = 12 months -> 24 transactions
```

Each Transaction has:

```text
transaction_id
calloff_id
month
productcomponent_id
mw
q_factor
```

The `q_factor` should come from the PortfolioProductComponent/QFactorSet/QFactorValue for the matching portfolio, product component and month.

For Baseloads seed data, expected q_factor is 1.0 for both `base.sys` and `base.epad`.

## Price display

The UI should show the selected period and the MW quantity.

If existing price API functions are easy to reuse, show indicative prices for:

```text
base.sys
base.epad
```

If not, keep pricing display minimal and do not block the purchase flow on price API integration.

The purchase flow's core requirement is calloff and transaction creation.

## Required implementation

Use the repository's existing stack and conventions.

If no frontend exists yet, create a minimal local web interface using the simplest suitable stack already available in the project.

Suggested implementation areas, adapt as needed:

```text
src/purchase/baseloadsPurchase.ts
src/purchase/periodOptions.ts
src/purchase/BaseloadsPurchaseView.*
tests/purchase/baseloadsPurchase.test.ts
```

Do not over-engineer authentication, sessions or production deployment.

## Required functions

Implement business logic separate from UI where practical:

```text
getBaseloadsPurchasePeriods
createBaseloadsCalloff
createBaseloadsTransactions
purchaseBaseloads
```

The UI should call the business logic rather than duplicating transaction construction in the view.

## Validation rules

Reject:

- missing portfolio,
- portfolio not linked to Baseloads product flow,
- missing MW,
- non-numeric MW,
- MW less than or equal to zero,
- missing period,
- unknown period option,
- missing Baseloads product configuration,
- missing `base.sys` or `base.epad` product component,
- missing Q-factor value for a transaction month/component.

## Tests

Add tests for:

1. period dropdown contains 4 years, 11 quarters and 6 months,
2. month purchase creates one calloff and 2 transactions,
3. quarter purchase creates one calloff and 6 transactions,
4. year purchase creates one calloff and 24 transactions,
5. both `base.sys` and `base.epad` are purchased together,
6. transaction MW equals the input MW,
7. q_factor is read from the linked Q-factor values,
8. missing q_factor gives a clear error,
9. invalid MW is rejected,
10. UI renders a professional Baseloads purchase form,
11. successful purchase shows calloff id and transaction count.

## Documentation

Create:

```text
docs/purchase/baseloads_purchase_flow.md
```

Document:

```text
purpose of the flow
period option rules
Calloff creation
Transaction creation
why a quarter creates 6 transactions
how q_factor is read
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
- UI entry point,
- business functions added,
- tests added,
- tests run,
- test result,
- example transaction count for a quarter purchase,
- REPOSITORY_FILES.md status.
