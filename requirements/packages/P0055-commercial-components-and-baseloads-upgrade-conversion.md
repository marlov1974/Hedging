# P0055 - Commercial components and Baseloads upgrade conversion

## Purpose

Add requirements for commercial price components, customer-side add-on event details, calloff pricing rules for Baseloads and Peaks/Modern, and upgrade conversion from market-near Baseloads to Peaks/Modern.

This package builds on the target model in `docs/hedging/two_legged_market_basis_target_model.md`.

## 1. Product configuration price components

Commercial add-on prices must be configured as price components under product configuration.

Required price components:

```text
fee.calloff
premium.q_term
premium.p_agent
```

Rules:

- Price components are public-safe synthetic configuration in the PoC.
- Prices remain per MWh.
- Do not convert configured prices to price per MW.
- Store enough reference/source information on generated event details to explain which configured price was used at calloff time.
- Historical event details must not be recalculated from the latest product configuration if configuration changes later.

## 2. Add-ons as separate customer event details

Commercial add-ons must be represented as separate customer-side event details.

Do not fold them into the hedge price.

Do not create market legs for these add-ons by default.

Customer add-on components:

```text
fee.calloff
premium.q_term
premium.p_agent
```

Price types remain per MWh, for example:

```text
SEK_PER_MWH
EUR_PER_MWH
LOCAL_CCY_PER_MWH
```

Value is derived from volume and price per MWh.

## 3. Fee logic

`fee.calloff` is a transaction activity fee.

Rules:

- Fee is always positive.
- Fee is created for each calloff event where fee applies.
- Fee volume is based on absolute customer-facing calloff volume for that event.
- Buy and sell both generate positive fee volume.
- Fee is not calculated from net position.
- Fee is not calculated from market basis volume.
- Fee must not double count SYS and EPAD/area if they are part of the same customer calloff and represent the same customer volume layer.
- Separate calloffs are charged separately.

Examples:

```text
Baseloads same calloff:
market.base.sys  +100 MWh
market.base.epad +100 MWh
fee.calloff      +100 MWh
```

```text
Baseloads two separate calloffs:
calloff 1: market.base.sys  +100 MWh -> fee.calloff +100 MWh
calloff 2: market.base.epad +100 MWh -> fee.calloff +100 MWh
Total fee volume = 200 MWh
```

```text
Modern/Peaks buy:
modern.base +60 MWh
modern.peak +40 MWh
fee.calloff +100 MWh
```

```text
Modern/Peaks sell:
modern.base -30 MWh
modern.peak -20 MWh
fee.calloff +50 MWh
```

## 4. Q-term logic

`premium.q_term` follows `modern.peak`.

Rules:

- Q-term volume equals signed `modern.peak` volume.
- Buying peak creates positive Q-term.
- Selling peak creates negative Q-term.
- Q-term is separate from Q-factor transformation.
- Q-term is a commercial customer premium, not a market basis factor.

Example:

```text
modern.peak    +40 MWh
premium.q_term +40 MWh
```

```text
modern.peak    -20 MWh
premium.q_term -20 MWh
```

## 5. P-agent logic

`premium.p_agent` is simplified in the PoC.

Real-world direction:

```text
p-agent may be derived from virtual derivative volumes
```

PoC rule:

```text
premium.p_agent follows modern.peak, same volume logic as premium.q_term
```

Rules:

- P-agent volume equals signed `modern.peak` volume in the PoC.
- Buying peak creates positive P-agent.
- Selling peak creates negative P-agent.
- P-agent is a customer commercial premium, not a market leg.

## 6. Baseloads calloff pricing

Baseloads is market-near.

For Baseloads calloffs, the hedge-relevant position is represented in the market leg:

```text
market.base
```

Baseloads normally has no separate customer hedge leg. Customer-side add-ons may still exist as customer event details, for example `fee.calloff`.

Rules:

- Baseloads hedge price comes from the market/base calloff flow.
- Baseloads report/projection reads market basis.
- Fee is still generated as a customer event detail using customer-facing calloff volume.
- Q-term and P-agent do not apply to pure Baseloads unless explicitly configured later.

## 7. Peaks/Modern calloff pricing

For Peaks/Modern calloffs:

- Customer hedge components are Modern customer components.
- Market hedge components are market basis components.
- Q-factor transforms Modern peak to market base.
- Q-term and P-agent are separate customer details following signed `modern.peak`.
- Fee is a separate positive customer detail based on absolute customer calloff volume.

Do not combine hedge price, Q-term, P-agent and fee into one price.

## 8. Baseloads to Peaks/Modern upgrade: two calloffs

Upgrade from Baseloads to Peaks/Modern must be executed as two linked calloffs:

```text
1. MARKET_REBALANCE_CALLOFF
2. CUSTOMER_CONVERSION_CALLOFF
```

### 8.1 Market rebalance calloff

Purpose: trade market base delta so the market position reaches the target for the upgraded product.

Input includes:

```text
period
price_area
target_percentage_of_forecast
target customer product = Peaks/Modern
SYS and EPAD/area dimension
```

Rules:

- Calculate target Modern customer shape from the forecast percentage.
- Convert target Modern shape to target market base using Q-factors.
- Compare target market base with current open market base.
- Trade only the market delta.
- This calloff creates market leg details.
- This calloff does not create the final Modern customer hedge components.

### 8.2 Customer conversion calloff

Purpose: create customer Modern components from the resulting open market position after the market rebalance.

Rules:

- Runs after the market rebalance calloff.
- Reads the resulting open market base position.
- Calculates effective market base price as value divided by volume.
- Derives Modern customer component prices from the open market position.
- Does not use the price API for customer hedge component prices.
- Creates customer Modern components and customer add-ons.
- Does not trade additional market delta.

## 9. SYS and EPAD/area separation

The full upgrade conversion must be calculated separately for SYS and EPAD/area.

Do not blend SYS and EPAD/area value, volume or effective price.

Required separation:

```text
SYS:
current open market base sys
target market base sys
delta sys
effective sys price
derived customer sys components

EPAD/area:
current open market base area
target market base area
delta area
effective area price
derived customer area components
```

## 10. Tests

Add or update tests for:

1. Product configuration can define `fee.calloff`, `premium.q_term`, and `premium.p_agent` prices.
2. Add-ons are generated as separate customer event details.
3. Add-on prices remain per MWh.
4. Fee is always positive.
5. Fee uses absolute customer-facing calloff volume.
6. Fee does not double count SYS and EPAD/area inside the same customer calloff.
7. Separate SYS and EPAD/area calloffs each generate fee.
8. Q-term follows signed `modern.peak`.
9. P-agent follows signed `modern.peak` in the PoC.
10. Baseloads calloff creates market basis hedge details and customer fee details, but no Baseloads customer hedge detail by default.
11. Peaks/Modern calloff creates Modern customer hedge details, Market basis details, and add-on customer details.
12. Baseloads-to-Peaks/Modern upgrade uses two linked calloffs.
13. Market rebalance calloff trades market delta first.
14. Customer conversion calloff derives customer hedge prices from resulting open market position, not price API.
15. SYS and EPAD/area conversion calculations are separated.

## Non-goals

Do not implement real price components or real customer data.

Do not use real market data.

Do not fold add-ons into hedge price.

Do not make fee negative on sells.

Do not blend SYS and EPAD/area in upgrade conversion.

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

Update `REPOSITORY_FILES.md` if tracked files change.
