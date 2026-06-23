# P0033 - Peaks.Modern Forecast and Hedge Forecast must use Modern Projection terms

## Purpose

Change the `Peaks.Modern` customer-facing forecast and hedge forecast flow so the user works in `modern.base` / `modern.peak` terms, while all persisted data continues to be stored in and read from the canonical component model.

This is a coding package.

## Core principle

`Peaks.Modern` is a product package with a Modern Feature Set.

The customer experience must be expressed in modern-projected terms:

```text
modern.base
modern.peak
```

The database must still use the canonical component model:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

Therefore:

```text
UI / feature flow = modern projection
Persistence / source of truth = canonical model
```

Do not create a separate persisted modern-only model.

## Dependency

This package depends on P0025-P0032.

Expected canonical Peaks components:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

Expected modern projected component names from P0032:

```text
modern.base.sys
modern.base.epad
modern.peak.sys
modern.peak.epad
```

## Required feature behavior

Update `Peaks.Modern` features so both of these customer flows are expressed in modern projection terms:

```text
Forecast
Hedge Forecast
```

### Forecast feature

The Forecast feature should show and allow editing of forecast in modern base/peak terms.

It should no longer primarily describe the forecast as:

```text
forecast_mwh
peak_pct
```

although those may still exist as internal/source fields.

Customer-facing forecast rows should instead use modern terms such as:

```text
month
modern.base_mwh
modern.peak_mwh
```

Optional helper/display columns are allowed if useful:

```text
total_mwh
peak_total_mwh
peak_pct
warnings
```

But the primary editable model for `Peaks.Modern` should be:

```text
modern.base_mwh
modern.peak_mwh
```

### Hedge Forecast feature

The Hedge Forecast flow should describe the generated hedge proposal in modern terms:

```text
modern.base
modern.peak
```

The user should see/edit hedge amounts as:

```text
modern.base_mwh
modern.peak_mwh
```

not as canonical `base.sys`, canonical `peak.sys`, or raw `peak_pct` mechanics.

## Modern projection definitions

For each month:

```text
H  = total_h
Hp = peak_h
Ho = offpeak_h
```

Modern projection semantics:

```text
modern.base = offpeak level applied as base layer over the whole month
modern.peak = extra peak layer above modern.base during peak hours
```

Thus:

```text
modern.base_mwh = modern.base_mw * H
modern.peak_mwh = modern.peak_mw * Hp
```

The actual peak level is:

```text
peak_level_mw = modern.base_mw + modern.peak_mw
```

The actual peak MWh is:

```text
peak_level_mwh = peak_level_mw * Hp
```

The actual offpeak MWh is:

```text
offpeak_mwh = modern.base_mw * Ho
```

The total monthly MWh represented by modern.base/modern.peak is:

```text
total_mwh = modern.base_mwh + modern.peak_mwh
```

This works because:

```text
modern.base_mwh = modern.base_mw * H
modern.peak_mwh = modern.peak_mw * Hp
```

and physical energy equals:

```text
modern.base_mw * Ho + (modern.base_mw + modern.peak_mw) * Hp
= modern.base_mw * H + modern.peak_mw * Hp
```

## Convert modern UI values to canonical model

When the user creates or edits a `Peaks.Modern` forecast or hedge forecast using:

```text
modern.base_mwh
modern.peak_mwh
```

convert to canonical values as follows.

### Step 1: modern MW values

```text
modern_base_mw = modern.base_mwh / H
modern_peak_mw = modern.peak_mwh / Hp
```

If `H = 0` or `Hp = 0`, block save/accept and show a validation error.

### Step 2: actual peak allocation level

```text
allocation_peak_mw = modern_base_mw + modern_peak_mw
```

### Step 3: canonical base MW

Canonical base is the flat monthly average over total_h.

The total represented MWh is:

```text
total_mwh = modern.base_mwh + modern.peak_mwh
```

Therefore:

```text
canonical_base_mw = total_mwh / H
```

Equivalent:

```text
canonical_base_mw = modern_base_mw + modern_peak_mw * Hp / H
```

### Step 4: canonical peak MW

Canonical peak component is relative to flat monthly base:

```text
canonical_peak_mw = allocation_peak_mw - canonical_base_mw
```

Equivalent:

```text
canonical_peak_mw = modern_peak_mw * Ho / H
```

### Step 5: canonical rows to write

Write canonical rows:

```text
allocation.peak.sys.mw  = allocation_peak_mw
allocation.peak.epad.mw = allocation_peak_mw
base.sys.mw             = canonical_base_mw
base.epad.mw            = canonical_base_mw
peak.sys.mw             = canonical_peak_mw
peak.epad.mw            = canonical_peak_mw
```

Allocation rows:

```text
price = 0
q_factor = 0
category = allocation
```

Base and peak rows remain priced/q-factor relevant according to existing component metadata.

## Convert canonical model to modern UI values

When reading an existing forecast/hedge/calloff from canonical rows, derive modern values for display/editing.

Canonical inputs:

```text
B = effective canonical base MW
A = effective allocation peak MW
P = effective canonical peak MW
H = total_h
Hp = peak_h
Ho = offpeak_h
```

Preferred derivation from `B` and `A`:

```text
total_mwh = B * H
peak_level_mwh = A * Hp
offpeak_mwh = total_mwh - peak_level_mwh
modern_base_mw = offpeak_mwh / Ho
modern_peak_mw = A - modern_base_mw
modern.base_mwh = modern_base_mw * H
modern.peak_mwh = modern_peak_mw * Hp
```

If the canonical relation `A = B + P` does not hold within tolerance, warn and still derive display values from `B` and `A`.

If `Ho = 0`, show validation/read warning and avoid division by zero.

## Hedge percentage behavior

If the user enters a hedge percentage in `Hedge Forecast`, it should scale modern projected values.

Starting forecast values:

```text
forecast_modern_base_mwh
forecast_modern_peak_mwh
```

For hedge percentage `h`:

```text
hedge_modern_base_mwh = forecast_modern_base_mwh * h
hedge_modern_peak_mwh = forecast_modern_peak_mwh * h
```

Then convert these hedge values to canonical rows using the conversion rules above.

This means the customer sees and edits modern base/peak values, while the accepted hedge writes canonical component transactions.

## Editing behavior

In Forecast:

- editing `modern.base_mwh` should update the derived total and canonical values,
- editing `modern.peak_mwh` should update the derived total and canonical values,
- negative `modern.peak_mwh` is allowed,
- negative `modern.base_mwh` should be blocked unless a later package explicitly supports it.

In Hedge Forecast:

- generated proposal rows should use modern base/peak MWh,
- user edits should be applied in modern base/peak terms,
- acceptance writes canonical rows only,
- do not persist projected `modern.*` rows as raw source-of-truth transactions.

## Prices

Forecast editing does not need prices.

Hedge Forecast acceptance should continue to create priced canonical transactions according to existing price logic.

Projected modern price views are handled by P0032/P0030 and should read from canonical rows after acceptance.

Do not use projected `modern.*` component names as persisted transaction component codes.

## Worked example

Calendar:

```text
H = 744
Hp = 320
Ho = 424
```

User enters modern forecast:

```text
modern.base_mwh = 87.7358491
modern.peak_mwh = 12.2641510
```

Modern MW:

```text
modern_base_mw = 87.7358491 / 744 = 0.1179245283
modern_peak_mw = 12.2641510 / 320 = 0.0383254719
```

Allocation peak level:

```text
allocation_peak_mw = 0.1179245283 + 0.0383254719 = 0.15625
```

Canonical base:

```text
total_mwh = 87.7358491 + 12.2641510 = 100
canonical_base_mw = 100 / 744 = 0.1344086022
```

Canonical peak:

```text
canonical_peak_mw = 0.15625 - 0.1344086022 = 0.0218413978
```

Rows to write:

```text
allocation.peak.sys  mw = 0.15625
allocation.peak.epad mw = 0.15625
base.sys             mw = 0.1344086022
base.epad            mw = 0.1344086022
peak.sys             mw = 0.0218413978
peak.epad            mw = 0.0218413978
```

Reading those canonical rows back must reproduce:

```text
modern.base_mwh ≈ 87.7358491
modern.peak_mwh ≈ 12.2641510
```

## Negative modern peak example

User enters:

```text
modern.base_mwh = 110
modern.peak_mwh = -10
```

This is valid if total remains valid:

```text
total_mwh = 100
```

`modern.peak_mwh` may be negative.

Acceptance should write canonical rows that represent that negative peak layer.

## UI label requirements

Use customer-facing labels:

```text
Modern Base MWh
Modern Peak MWh
```

or shorter labels if the context is clear:

```text
Base MWh
Peak MWh
```

Avoid labels like:

```text
forecast_mwh
peak_pct
canonical base
canonical peak
allocation peak
```

in the primary `Peaks.Modern` customer flow.

Those values may appear in debug/internal views only.

## Documentation

Create or update:

```text
docs/hedging/peaks_modern_forecast_feature.md
docs/hedging/peaks_modern_hedge_forecast_flow.md
docs/hedging/modern_to_canonical_conversion.md
```

Document:

- Forecast and Hedge Forecast are customer-facing Modern Projection flows,
- users edit modern.base/modern.peak MWh,
- canonical model remains the source of truth,
- conversion modern -> canonical,
- conversion canonical -> modern,
- negative modern peak handling,
- acceptance writes canonical rows only.

## Tests

Add or update tests for:

1. Peaks.Modern Forecast displays/editable modern.base_mwh and modern.peak_mwh,
2. primary Forecast UI no longer uses forecast_mwh/peak_pct as the main edit model,
3. editing modern.base_mwh and modern.peak_mwh converts to canonical rows correctly,
4. canonical rows convert back to the same modern.base_mwh and modern.peak_mwh within tolerance,
5. Hedge Forecast generated proposal uses modern.base_mwh and modern.peak_mwh,
6. Hedge Forecast percentage scales both modern.base_mwh and modern.peak_mwh,
7. accepting Hedge Forecast writes canonical rows only,
8. no persisted transaction uses `modern.base.sys`, `modern.base.epad`, `modern.peak.sys`, or `modern.peak.epad` as source-of-truth component codes,
9. negative modern.peak_mwh is allowed,
10. negative modern.base_mwh is rejected,
11. zero H/Hp/Ho does not divide by zero,
12. worked example writes the expected canonical rows,
13. reading expected canonical rows reproduces the worked example modern values,
14. P0032 Modern Projected Transactions still show projected `modern.*` rows after canonical write.

## Non-goals

Do not change:

- canonical component vocabulary,
- market projection,
- Classic feature set,
- Legacy Calloff List,
- settlement,
- Profiles projections.

This package changes the Peaks.Modern forecast and hedge forecast customer flow only.

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
- Forecast UI fields after change,
- Hedge Forecast UI/proposal fields after change,
- modern -> canonical conversion result for worked example,
- canonical -> modern roundtrip result,
- negative modern peak behavior,
- tests run and result,
- `REPOSITORY_FILES.md` status.
