# P0052 - Market-only Q/profile adjustments

## Purpose

Handle factor changes for Peaks/Profiles without creating new customer transactions.

## Requirements

1. If Q-factor or profile-factor changes for a Peaks/Profile customer position, do not create a new customer leg.
2. Recalculate the target market basis from the existing customer leg and the new factor.
3. Compare target market basis with current open market basis.
4. Create a market-leg-only adjustment for the delta.
5. Store the adjustment reason.

Reasons:

```text
Q_FACTOR_UPDATE
PROFILE_FACTOR_UPDATE
```

6. Store the factor used on the market detail.
7. Customer commercial position remains unchanged.
8. Default downgrade policy: open market-only adjustments are included when projecting downgrade to Baseloads, unless explicitly waived.

## Tests

Cover:

1. Q/profile change creates no customer leg.
2. Q/profile change creates market leg only when market delta exists.
3. Adjustment reason is stored.
4. Factor used is stored.
5. Downgrade policy can include open market-only adjustments.

## Non-goals

Do not finalize all commercial waiver handling in this package.

## Verification

Run npm test, git status --short and git diff --check. Update REPOSITORY_FILES.md if tracked files change.
