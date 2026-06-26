# Baseloads to Peaks/Modern upgrade

## Purpose of this section

Explain how a customer is upgraded from market-near Baseloads to Peaks/Modern using two linked calloffs.

## Notes and requirements for the section

- Explain why the upgrade is not one mixed event.
- Describe market rebalance calloff first.
- Describe customer conversion calloff second.
- Explain that customer component prices are derived from the resulting open market position, not from the price API.
- Explain that SYS and EPAD/area must be calculated separately.
- Keep the section suitable for business and architecture discussion.

## Current version of the text

A Baseloads-to-Peaks/Modern upgrade is handled as two linked calloffs. The first calloff is a market rebalance. It calculates the target market basis needed for the upgraded product, compares it with the current open market basis and trades only the market delta.

The second calloff is a customer conversion. It runs after the market rebalance and creates the new customer-facing Modern components from the resulting open market position. The prices on the customer components are derived from the effective open market position, not from the price API.

SYS and EPAD/area calculations must remain separated through the entire process. The model must not blend SYS and EPAD/area value, volume or effective price when creating the upgraded customer position.
