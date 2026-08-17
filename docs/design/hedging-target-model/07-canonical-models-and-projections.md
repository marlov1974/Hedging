# Canonical models and projections

## Purpose of this section

Explain what is stored as source of truth and what is derived as a view or projection.

## Notes and requirements for the section

- Define canonical model and projection.
- Explain that Classic, Modern and Baseloads are not three equal canonical models.
- State which source each view should read from.
- Make clear why compatibility views can exist without becoming source of truth.

## Current version of the text

The target model separates canonical storage from projections. A canonical model is the source of truth used to record business facts. A projection is a derived view used by reports, APIs, customer-facing formats or compatibility layers.

Market basis is canonical for market position, risk, netting, settlement and Baseloads reporting. Modern is the customer canonical basis for shaped products where the customer product representation differs from market basis. Classic is a projection from Modern and exists as a compatibility and reporting view.

Baseloads is projected from market canonical because it is a market-near product. This means Baseloads can be reported to customers without creating a separate Baseloads customer hedge source of truth.
