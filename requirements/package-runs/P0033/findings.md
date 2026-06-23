# P0033 Findings

## Result

P0033 changes Peaks.Modern Forecast and Hedge Forecast customer flows to use Modern Projection terms while keeping canonical persistence as source of truth.

## Forecast UI Fields

Forecast now displays and edits:

```text
Base MWh
Peak MWh
```

The saved internal forecast row still stores:

```text
mwh
peak_pct
```

## Hedge Forecast Fields

Hedge Forecast generated profiles now display and edit:

```text
Base MWh
Peak MWh
```

Hedge percentage scales both modern base and modern peak values.

## Canonical Persistence

Accepting a Hedge Forecast writes canonical rows only:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
```

No `modern.*` component rows are persisted.

## Worked Example

For:

```text
H = 744
Hp = 320
modern.base_mwh = 87.735849
modern.peak_mwh = 12.264151
```

the conversion yields:

```text
modern_base_mw = 0.117925
modern_peak_mw = 0.038325
allocation_peak_mw = 0.15625
canonical_base_mw = 0.134409
canonical_peak_mw = 0.021841
```

## Verification

```text
npm test
tests 229
suites 20
pass 229
fail 0
git diff --check
git diff --cached --check
REPOSITORY_FILES.md matches git ls-files
```

`REPOSITORY_FILES.md` was regenerated because P0033 adds source, docs and package-run files.
