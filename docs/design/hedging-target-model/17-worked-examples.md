# Worked examples

## Purpose of this section

Make the target model easier to understand through simple synthetic examples.

## Notes and requirements for the section

- Use only public-safe synthetic examples.
- Include Baseloads calloff.
- Include Modern/Peaks calloff.
- Include fee on buy and sell.
- Include Q-term and P-agent on peak.
- Include Baseloads-to-Peaks/Modern upgrade.
- Include downgrade to Baseloads.
- Include market-only Q/profile adjustment.
- Keep examples small and readable.

## Current version of the text

This section will contain small examples that show how the model behaves. The examples should demonstrate how event details are created, how customer and market legs differ, how Baseloads is projected from market basis, how add-ons are represented and how product changes are handled.

Example topics to include:

```text
Baseloads calloff with fee
Modern/Peaks calloff with market basis
Sell calloff with positive fee
Q-term and P-agent following signed modern.peak
Baseloads-to-Peaks upgrade with market rebalance and customer conversion
Downgrade to Baseloads from open market basis
Market-only adjustment after Q-factor change
```
