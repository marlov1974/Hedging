# Open questions and provisional decisions

This file distinguishes settled design direction from points that still need business, legal, risk or implementation validation.

## Provisional but strong direction

- Internal truth should be separated from market and customer representations.
- Commercial products should be assembled from reusable components and configuration rather than modeled as isolated hard-coded bundles.
- Peak/Offpeak should become a customer/legacy projection rather than canonical internal forecast structure.
- One monthly forecast plus a customer-specific Peak Q-factor is preferred for PF Energy-like products.
- 15m Profile without Volume Risk is modeled as PF Flex with 0% tolerance.
- PF Flex should be monthly and aggregated, not annual/manual and not allocated through arbitrary site rules.
- V-term should be a separate component/transaction and removing Volume Risk should reverse at latest V-term, leaving any price difference as residual settlement basis.
- Standalone EPAD pricing differences belong in quote/bundling logic, not in a separate product type.

## Open questions

### Naming and decomposition of the base hedge

The earlier `Baseload` component name is likely too broad. Current direction is to distinguish Sys and EPAD internally while retaining base-block terminology in execution where appropriate. The exact canonical class names and how Sys/EPAD combine with temporal shape still need to be finalized.

### PF Andel cap

A finite high cap is preferred to vague unlimited exposure. Around 50% has been suggested as an illustrative candidate, but the actual cap must be validated against historical consumption distributions, pricing, contractual commitments and risk appetite.

### Exact PF Andel vs PF Flex common model

There may be a shared underlying volume-risk settlement engine with different parameterization, but PF Andel's fixed-share construction and PF Flex's tolerance-band construction are not necessarily identical. Avoid collapsing them prematurely until settlement equations are formalized.

### Peak Q-factor methodology

The target concept is clear, but details need specification:

- historical lookback period;
- treatment of missing/abnormal data;
- country/Nordic peak calendar definition;
- recalculation cadence and effective-date rules;
- what happens to already hedged delivery months after a Q-factor update.

### V-term reversal mechanics

The high-level rule is current V-term reversal plus residual. Exact sign conventions, invoice presentation, tax treatment, effective date and how residuals amortize/run off need explicit formulas and test cases.

### EMIR / regulatory profile

EMIR and possible EMIR-like reporting should remain independent capabilities/features rather than hard-coded product families. Exact applicability must be derived from legal/regulatory requirements, not inferred from the financial/physical presentation alone.

### B2B / B2C / common boundary

A broader architecture question remains whether shared hedging logic should conceptually live with B2B and be consumed by B2C, or whether B2B, B2C and Common should be three explicit areas. The current component work is B2B-focused and should not force that decision prematurely.

## Validation rule

When a point in these memory files conflicts with later verified requirements, market rules, contractual terms or explicit newer design decisions, the newer verified source should win and this memory should be updated. Do not treat examples or candidate parameter values as immutable business facts.
