# Downgrade and market-only adjustments

## Purpose of this section

Explain downgrade handling and market-only adjustments caused by Q/profile factor changes.

## Notes and requirements for the section

- Explain that Q/profile changes may require market changes without new customer transactions.
- Explain market-only adjustment events.
- Explain downgrade to Baseloads as projection of current open market basis.
- Explain the business rationale for keeping open market basis for the customer's account during downgrade unless waived.
- Keep waiver policy as an open or configurable decision where needed.

## Current version of the text

When Q-factors or profile factors change, the market hedge position may need to be adjusted even though the customer has not made a new commercial calloff. The model therefore supports market-only adjustment events. These create market leg details without creating new customer hedge details.

A downgrade to Baseloads should normally project the current open market basis into a Baseloads-facing customer position. The downgrade should not be treated as a clean reset unless this is explicitly agreed.

The business rationale is that a customer leaving a higher-margin shaped product should normally not leave the accumulated open profile or market-basis risk behind. The current open market position should remain for the customer's account unless waived as part of the commercial agreement.
