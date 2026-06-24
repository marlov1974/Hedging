# P0042 - Public market price fixtures

## Purpose

Refresh the PoC derivative price fixtures so generated tests and demo views use current public-market levels instead of older manual-looking values.

## Safety boundary

This repository is public-safe and must not store sensitive business material.

Public exchange market prices are allowed because they are public information. Do not commit customer names, organization names, internal product names, real contract terms, agreed customer adders, credentials, private feeds, raw market dumps, cookies, session tokens or proprietary source material.

## Source direction

Use Euronext Nord Pool Power Futures as the public reference for Nordic System Price and Stockholm EPAD base-load futures.

Use the public quotes snapshot as a reference observation for the PoC fixture values. This is not a licensed or operational market data cache.

## Required work

1. Document the source check under `requirements/package-runs/P0042/source-research.md`.
2. Replace the static annual `base.sys` and `base.epad` PoC levels for 2027-2030 with public Euronext snapshot values.
3. Replace seed-data base component prices so Baseloads, Classic and Modern demo output no longer shows the old manual 80/5 levels.
4. Keep peak/profile/volume component prices synthetic unless a public source for those specific modeled adders is introduced in a later package.
5. Add 12 annual-to-month distribution keys so the Price API can return seasonal monthly prices from the public annual base derivative observations.
6. Update tests and docs affected by the new fixture levels and monthly distribution keys.
7. Update `REPOSITORY_FILES.md` if tracked files are added.

## Verification

Run:

```bash
npm test
git diff --check
git status --short
```

## Expected result

The PoC keeps customer, contract and addon data synthetic/public-safe, while default demo base derivative prices use current Euronext Nord Pool Power Futures observations instead of arbitrary manual values.
