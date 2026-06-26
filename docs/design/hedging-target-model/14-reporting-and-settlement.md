# Reporting and settlement

## Purpose of this section

Explain how reporting and settlement should read the correct model layer.

## Notes and requirements for the section

- Explain which canonical/projection source each report should use.
- Make clear that settlement for market/risk should use market canonical.
- Make clear that customer settlement for Modern products may need Modern customer components.
- Explain Baseloads reporting from market canonical.
- Explain that prices in reports should be derived after aggregating value and volume.

## Current version of the text

Reports and settlement must read the correct source. Market position, risk and market settlement read market canonical. Baseloads reports also read market canonical because Baseloads is a market-near product.

Modern customer reporting can read Modern customer canonical where the customer product basis is commercially relevant. Classic reports are compatibility projections from Modern, not separate source-of-truth tables.

Where reports show effective prices, price should be derived last from aggregated value and aggregated volume. Reports should not average prices directly when signed rows, sells, rebalances or conversions are involved.
