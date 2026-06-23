# P0035 - Single portfolio with feature-level perspective switching

## Purpose

Correct the demo tool structure after P0034.

The PoC should demonstrate that the same canonical portfolio data can be viewed through several perspectives. The current UI still behaves too much like different portfolios/product packages are selected globally.

This package changes the tool to:

1. use one demo portfolio in the main UI,
2. remove/demote the global portfolio selector,
3. remove/demote the global perspective selector,
4. move perspective switching inside each feature.

This is a UI and feature-structure package.

## Background

P0034 introduced the universal model demo concept:

```text
Same portfolio
same canonical data
multiple perspectives
```

The current UI shows:

```text
Portfolio selector
Perspective selector
Feature list already filtered by global perspective
```

This is close, but it still makes the experience feel like the user is changing portfolio/product rather than looking at the same portfolio through different feature perspectives.

## Target interaction model

The main page should behave like this:

```text
Demo portfolio: fixed / implicit
Feature list: generic feature names
Perspective selection: inside each feature
```

The user should click a feature first, then switch perspective inside that feature.

Example:

```text
Feature: Forecast
Perspective tabs/dropdown: Baseloads | Classic | Modern
```

This allows the user to compare the same feature across perspectives without changing portfolio or dataset.

## Portfolio selector

There is currently only one relevant demo portfolio.

Remove or hide the Portfolio selector from the main demo UI.

If a selector must remain for technical reasons, it should be visually demoted and default to the single demo portfolio. It must not be central to the demo flow.

Recommended label if kept:

```text
Demo portfolio
```

not:

```text
Portfolio
```

Do not show multiple portfolio options as primary choices just to represent Baseloads, Classic and Modern. Those are now perspectives/features over the same data, not separate demo portfolios.

## Global perspective selector

Remove or hide the global Perspective selector from the main page.

Perspective should be selected inside each feature, not globally.

Do not show a global dropdown with:

```text
Baseloads
Classic
Modern
```

at the page level.

## Main feature list

The main feature list should use generic feature names without perspective suffixes.

Target main feature list:

```text
Portfolio Details
Forecast
Hedge Forecast
Calloff List
Position Report
Position
Data Viewer
Hedge Baseload
```

Do not show as main buttons:

```text
Forecast - Modern
Hedge Forecast - Modern
Calloff List - Modern
Position Report - Modern
Forecast - Classic
Forecast - Baseloads
```

The perspective belongs inside the feature.

## Feature-level perspective rules

### Forecast

Inside Forecast, provide perspective selector/tabs:

```text
Baseloads | Classic | Modern
```

Each tab/view shows the same underlying forecast/canonical data in that perspective.

- Baseloads: base/total-oriented forecast.
- Classic: Peak/Offpeak-oriented forecast.
- Modern: modern.base/modern.peak-oriented forecast per P0033.

### Hedge Forecast

Inside Hedge Forecast, provide perspective selector/tabs:

```text
Classic | Modern
```

No Baseloads perspective is required here.

- Classic: hedge forecast in Peak/Offpeak terms.
- Modern: hedge forecast in modern.base/modern.peak terms per P0033.

Both write canonical rows.

### Calloff List

Inside Calloff List, provide perspective selector/tabs:

```text
Baseloads | Classic | Modern
```

- Baseloads: base-only calloff list.
- Classic: Offpeak/Peak calloff list per P0029/P0030.
- Modern: Base/Peak calloff list per P0029/P0030.

Customer-facing calloff list volumes must use MWh columns per P0030.

### Position Report

Inside Position Report, provide perspective selector/tabs:

```text
Baseloads | Classic | Modern
```

- Baseloads: base-only position report.
- Classic: Peak/Offpeak position report.
- Modern: modern.base/modern.peak position report.

### Position

Inside Position, provide perspective selector/tabs:

```text
Baseloads | Classic | Modern
```

This can share projection logic with Position Report if appropriate.

### Data Viewer

Inside Data Viewer, provide perspective/view selector/tabs:

```text
Canonical | Baseloads | Classic | Modern
```

- Canonical: raw source-of-truth canonical rows.
- Baseloads: projected baseloads view.
- Classic: projected classic view.
- Modern: projected modern-only model per P0032.

The Data Viewer must clearly distinguish raw canonical rows from projected rows.

### Hedge Baseload

Hedge Baseload remains a single feature variant for now.

No perspective selector is required inside Hedge Baseload.

It writes canonical base rows.

## State behavior

Changing perspective inside a feature must not change:

```text
selected portfolio
canonical dataset
calloff data
forecast source data
```

It should only change the projection used by that feature.

Switching from Forecast Classic to Forecast Modern should keep the user in the Forecast feature and use the same underlying data.

Switching from Calloff List Classic to Calloff List Modern should keep the same calloffs and simply change projection.

## Demo explanation text

At top of the page or in an info panel, explain:

```text
This demo uses one canonical portfolio. Each feature can show the same data from different perspectives: Baseloads, Classic and Modern.
```

Avoid text that implies the user is selecting different portfolios to see different models.

## Seed/demo data requirement

If current seed data has separate portfolios such as:

```text
Baseloads Portfolio
Peaks.Classic Portfolio
Peaks.Modern Portfolio
Profiles.Classic Portfolio
Profiles.Modern Portfolio
```

then do one of the following:

1. create a single primary demo portfolio that is used by the main UI, or
2. keep old portfolios only as internal compatibility fixtures, but do not show them in the main UI as primary choices.

The main UI should demonstrate:

```text
one portfolio
multiple perspectives
```

## Projection/source-of-truth rule

All feature perspectives must read from or write to canonical model.

Projected rows are not source-of-truth transactions.

Modern projected rows from P0032:

```text
modern.base.sys
modern.base.epad
modern.peak.sys
modern.peak.epad
```

must remain projected rows only.

Canonical source rows remain:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

## UI acceptance criteria

1. Main UI has no central portfolio selector, or it is visually demoted and fixed to one demo portfolio.
2. Main UI has no global perspective selector.
3. Main feature buttons do not include perspective suffixes.
4. Forecast has internal perspective selector/tabs: Baseloads, Classic, Modern.
5. Hedge Forecast has internal perspective selector/tabs: Classic, Modern.
6. Calloff List has internal perspective selector/tabs: Baseloads, Classic, Modern.
7. Position Report has internal perspective selector/tabs: Baseloads, Classic, Modern.
8. Position has internal perspective selector/tabs: Baseloads, Classic, Modern.
9. Data Viewer has internal selector/tabs: Canonical, Baseloads, Classic, Modern.
10. Hedge Baseload remains single variant.
11. Switching perspective inside a feature does not change portfolio.
12. The UI copy explains that the same canonical portfolio is shown through different perspectives.

## Documentation

Create or update:

```text
docs/hedging/universal_model_demo_tool.md
docs/hedging/feature_level_perspective_switching.md
docs/hedging/single_demo_portfolio.md
```

Document:

- why portfolio selection is removed/demoted,
- why perspective selection is inside features,
- same portfolio / same canonical data / multiple perspectives,
- which features support which perspectives,
- projected rows are not source of truth.

## Tests

Add or update tests for:

1. main UI does not show multiple product-specific portfolios as primary choices,
2. main UI does not show global Perspective selector,
3. main feature list uses generic feature names,
4. Forecast perspective selector includes Baseloads, Classic, Modern,
5. Hedge Forecast perspective selector includes Classic, Modern,
6. Calloff List perspective selector includes Baseloads, Classic, Modern,
7. Position Report perspective selector includes Baseloads, Classic, Modern,
8. Position perspective selector includes Baseloads, Classic, Modern,
9. Data Viewer selector includes Canonical, Baseloads, Classic, Modern,
10. Hedge Baseload has no perspective selector,
11. switching perspective inside Forecast keeps same portfolio/data,
12. switching perspective inside Calloff List keeps same calloffs,
13. Modern Forecast still follows P0033,
14. Modern projected Data Viewer still follows P0032,
15. customer calloff lists still use MWh columns per P0030.

## Non-goals

Do not implement:

- production entitlement/contract visibility,
- product migration UI,
- settlement redesign,
- market projection changes,
- Profiles full projection logic beyond showing/hiding feature entries if already present.

This package is about demo tool structure and perspective placement.

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

Update `REPOSITORY_FILES.md` to match `git ls-files`.

## Completion report

Report:

- files changed,
- whether portfolio selector was removed or demoted,
- whether global perspective selector was removed,
- final main feature list,
- perspective selectors inside each feature,
- tests run and result,
- `REPOSITORY_FILES.md` status.
