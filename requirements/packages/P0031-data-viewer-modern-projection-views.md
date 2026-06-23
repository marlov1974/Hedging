# P0031 - Data Viewer Modern Projection Views

## Purpose

Add two Data Viewer table views:

```text
Modern Calloffs
Modern Transactions
```

These views show the same portfolio-linked calloff and transaction data in a Modern projection, so the PoC can demonstrate that the canonical model can be viewed through compatible model projections.

## Scope

- Keep existing raw `Calloffs` and `Transactions` views unchanged.
- Add `Modern Calloffs` as a calloff-scoped Modern projection view.
- Add `Modern Transactions` as projected Base/Peak transaction rows.
- Use the canonical Peaks projection logic from P0029/P0030.
- Hide allocation rows from Modern projected customer rows.
- Keep raw canonical MW visible in the original `Transactions` Data Viewer.

## Non-Goals

- Do not redesign canonical transaction storage.
- Do not change forecast hedge generation.
- Do not change market projection or settlement.

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

Update `REPOSITORY_FILES.md`.
