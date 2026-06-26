# P0049 - Market bases canonical

## Purpose

Make Market bases the canonical market leg basis.

Market basis is used for market position, risk, netting and settlement.

## Requirements

1. Market leg basis is Market bases.
2. Market components use `market.base.<area>` or closest existing safe component shape.
3. Baseloads customer rows create market base rows with factor 1.
4. Peak/Profile customer rows create market base rows using the relevant factor.
5. Store the factor used on the market detail when it is part of the decision.
6. Do not calculate historical market rows from the latest factor only.
7. Preserve value across customer-to-market conversion.

Core transformation:

```text
market_quantity = customer_quantity * factor
market_price = customer_price / factor
customer_quantity * customer_price = market_quantity * market_price
```

## Tests

Cover:

1. Baseloads produces market base with factor 1.
2. Peak/Profile produces market base with non-1 factor.
3. Value is preserved by the transformation.
4. Factor used is stored with the market detail.
5. Market settlement can read market basis rows.

## Non-goals

Do not complete Baseloads reporting or product migration in this package.

## Verification

Run npm test, git status --short and git diff --check. Update REPOSITORY_FILES.md if tracked files change.
