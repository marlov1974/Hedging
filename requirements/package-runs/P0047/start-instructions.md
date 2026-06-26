# P0047 Codex start instructions

You are starting the target-model refactor.

Before coding, read all model documentation and all refactor packages in order:

```text
README.md
AGENTS.md
REPOSITORY_FILES.md
docs/hedging/two_legged_market_basis_target_model.md
requirements/packages/P0047-two-legged-transaction-model.md
requirements/packages/P0048-modern-customer-canonical.md
requirements/packages/P0049-market-bases-canonical.md
requirements/packages/P0050-baseloads-from-market-canonical.md
requirements/packages/P0051-rebalance-product-migration.md
requirements/packages/P0052-market-only-q-profile-adjustments.md
requirements/packages/P0053-projection-read-model-cleanup.md
requirements/packages/P0054-legacy-compatibility-cleanup.md
```

Build only P0047 in this run.

P0047 goal: introduce the two-legged event/detail foundation with customer legs and market legs. Do not implement the later packages yet.

Implementation constraints:

1. Keep the app running.
2. Preserve existing behavior through compatibility wrappers where needed.
3. Keep data public-safe and synthetic.
4. Do not make Classic, Baseloads or Market-basis changes beyond what is needed to support leg type foundation.
5. Add focused tests for leg type, linked legs and signed quantities.
6. Update documentation only where P0047 requires it.
7. Update `REPOSITORY_FILES.md` if tracked files change.

Verification:

```bash
npm test
git status --short
git diff --check
```

Completion report must state:

- files inspected,
- files changed,
- how customer and market legs are represented,
- compatibility approach,
- tests added/updated,
- npm test result,
- git diff --check result,
- REPOSITORY_FILES.md status.
