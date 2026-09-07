# Settlement, invoicing and product migration

This file captures current thinking on how component changes should affect settlement and invoicing, and how customers can migrate between commercial products without destroying economic history.

## Product migration principle

A product change should preferably be represented as changes to reusable components and configuration rather than as a complete replacement of the customer's economic history.

Examples:

- a customer can start with a simple base-price hedge and later add a profile component;
- a customer can move from a simpler Portfolio MW-like package to a PF Energy-like package by adding a profile component and trading into the required additional position;
- a customer can remove Volume Risk while retaining the economic residual created by the reversal.

This allows product migration to be an economic lifecycle operation rather than a data reset.

## Settlement is component-aware

Some components affect price only; others change the settlement function itself.

Examples:

- Sys/EPAD/base-price components establish hedge price economics;
- Profile Risk adds shape-cost protection;
- Volume Risk changes how actual volume deviations are treated;
- Seasonality Financing redistributes price through time;
- residuals from component exits continue to influence settlement even after the active service has ended.

The model therefore needs explicit settlement rules, not just a list of transaction prices.

## Profile Risk without Volume Risk

A 15-minute Profile Risk product can exist without Volume Risk. In that case:

- the profiled hedge applies to the covered/reference monthly volume;
- any actual volume deviation outside that volume remains variable/unhedged;
- the cleanest implementation is equivalent to **PF Flex with 0% flex tolerance**.

This avoids silently granting volume protection as a side effect of profile protection.

## PF Flex simplification

The target standard should be deterministic and easy to invoice:

- flex tolerance is evaluated per month;
- deviations within the configured tolerance receive the configured portfolio treatment;
- deviations outside tolerance are variable;
- tolerance is evaluated on the aggregated contract/portfolio volume unless a specific legal/commercial exception is explicitly modeled.

Avoid standard-product alternatives for annual netting or arbitrary site allocation because they cause manual settlement, forgotten follow-up and conflict.

## PF Andel

PF Andel fixes a selected share of forecast volume and leaves the remaining share variable. It should still have a clear maximum deviation/risk cap rather than relying on vague unlimited-risk language plus disclaimers.

The exact cap remains a business/risk decision. A high cap such as 50% has been discussed as potentially more realistic and operationally enforceable than an effectively unlimited promise.

## V-term exit and residual settlement basis

When Volume Risk is removed:

1. reverse the previous V-term exposure using the latest V-term price;
2. retain any economic difference between original and reversal as a residual premium/discount;
3. include that residual in the position used for settlement until it naturally runs off or is otherwise settled.

The residual is not a new active Volume Risk service. It is remaining settlement basis created by the economically priced exit.

## Customer invoice basis

Customer invoice rows are a projection of internal settlement economics. They should not be forced to mirror market transactions one-to-one.

This is especially important for:

- 15m Profile, where market/internal profile uplift may be expressed in base equivalents while customer pricing is full monthly volume × Q-term;
- legacy Peak/Offpeak, where customer reports may still show Peak and Offpeak even though internal truth is full monthly volume plus a Peak Q-factor/profile uplift;
- residual V-term economics, where the customer-facing invoice may show a premium/discount without exposing internal reversal mechanics.

## Legacy Peak/Offpeak forecast removal

For PF Energy-like customers, separate contract forecast values for Peak and Offpeak should not be canonical target-state data.

Prefer:

- one monthly forecast volume;
- one customer-specific Peak Q-factor;
- periodic recalculation of Peak Q-factor based on historical consumption;
- projection into Peak/Offpeak only for legacy customer representation while needed.

This keeps forecast truth simple while preserving current customer-facing semantics during migration.
