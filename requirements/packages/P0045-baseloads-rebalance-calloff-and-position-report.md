# P0045 - Baseloads rebalance calloff and position report

## Purpose

Add requirements for a Baseloads position report and a Baseloads forecast-rebalance calloff flow.

This package builds on P0044.

## Baseloads position report

The Baseloads position report must show one compressed monthly Baseloads row where the monthly hedge price is calculated from aggregated value and aggregated reportable volume.

Rule:

```text
reportable_base_volume = sum(signed base volume)
hedge_value = sum(signed base volume * base price) + sum(signed peak volume * peak price)
effective_month_hedge_price = hedge_value / reportable_base_volume
```

Price is calculated last. Do not average prices directly.

For this package, Peaks value counts in the monthly hedge price, but Peaks volume does not count as reportable Baseloads volume.

Example:

```text
Base +100 at 100
Peak +50 at 110
Peak -50 at 55
```

Expected Baseloads report row:

```text
Base 100 at 127.50
```

Settlement row:

```text
100 * (S - 127.50)
```

The report is a projection. Canonical event details must stay unchanged.

## Baseloads rebalance calloff

Add a Baseloads calloff mode that rebalances toward a target percentage of forecast.

Inputs:

```text
portfolio_id
period
price_area
target_percentage_of_forecast
```

The target uses base forecast only. Peak forecast must be ignored.

Rule:

```text
target_base_volume = base_forecast_volume * target_percentage_of_forecast
current_base_volume = current net base volume in the Baseloads position projection
rebalance_delta = target_base_volume - current_base_volume
```

If the delta is positive, create a positive signed detail. If the delta is negative, create a negative signed detail. If the delta is zero, no detail is needed.

The flow must move the position toward the target. It is not a buy-only flow.

## Derivative name

Generated rebalance details must receive derivative names at calloff time.

The derivative name must identify the action as rebalance and remain synthetic/public-safe, for example:

```text
Baseloads Rebalance Month 2027-01 STO
```

Do not rely only on later component plus period name derivation for these rows.

## Tests

Add or update tests for:

1. Peaks value affects Baseloads effective hedge price.
2. Peaks volume does not affect Baseloads reportable volume.
3. Effective hedge price is value divided by reportable volume.
4. The example above gives 100 at 127.50.
5. Rebalance requires target percentage and price area.
6. Rebalance uses base forecast only.
7. Rebalance creates positive and negative signed details as needed.
8. Rebalance derivative names are assigned at calloff time.
9. Existing tests still pass or are deliberately updated.

## Non-goals

Do not redesign P0044. Do not count Peaks volume as Baseloads reportable volume. Do not use peak forecast as the Baseloads rebalance target.

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

Update `REPOSITORY_FILES.md` if tracked files change.
