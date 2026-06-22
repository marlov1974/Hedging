# P0016 review

## Classification

WARN

## Evidence

- `requirements/packages/P0016-baseloads-purchase-flow.md` asks for a coding package with business logic and a simple professional web purchase flow.
- Existing database modules provide `Calloff`, `Transaction`, product components, portfolio product components, Q-factor sets and monthly Q-factor values.
- Existing project stack is Node TypeScript with `node --test` and a small `node:http` server pattern in `src/price-api/server.ts`.
- No frontend framework exists.

## Scope decision

Proceed with a minimal Node/TypeScript purchase module and web view/server.

## Period interpretation

P0016 requires:

```text
4 full years
11 quarters
6 months
```

P0015 seed data covers 2027-01 through 2029-12. The period dropdown will be deterministic:

- years: 2027, 2028, 2029, 2030
- quarters: Q1 2027 through Q3 2029
- months: Jan 2027 through Jun 2027

Business logic validates Q-factor availability on purchase, so any future period without seed values fails with a clear missing Q-factor error.

## Public-safety result

The implementation uses only synthetic seed data, neutral labels and no credentials or external network calls.
