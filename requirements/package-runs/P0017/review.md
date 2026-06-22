# P0017 review

## Classification

PASS

## Evidence

- `requirements/packages/P0017-hedging-tool-shell-and-baseloads-calloff-list.md` asks for a coding package.
- P0016 already provides Baseloads purchase business logic and a simple server-rendered purchase form.
- P0015 provides synthetic portfolios, product components, prices, calendars and Q-factor values required for calloff list aggregation.
- Existing transactions do not store price, so P0017 must use linked `PriceComponent` values for the calloff list price column.

## Scope decision

Proceed with a small hedging tool shell using existing TypeScript and `node:http` patterns.

## Naming decision

Exact public exchange instrument naming is not implemented. P0017 will add an isolated helper with a deterministic market-style convention:

```text
<price area> <component> <period>
```

Examples:

```text
SE3 base.sys Jan-27
SE3 base.sys Q1-27
SE3 base.sys YR-27
```

The helper can be replaced later without changing the UI table code.
