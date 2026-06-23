# Modern Projected Model

For the complete distinction between canonical source rows and projected `modern.*` names, see [Component Catalog](component_catalog.md).

P0032 defines Modern projection views as read-only compatibility projections from the canonical component model.

Canonical rows remain the source of truth. The raw Data Viewer `Transactions` table continues to show canonical component rows and MW values. The Modern projected views expose derived rows with explicit projected component names so a user can inspect how the same canonical calloff can be viewed as a Peaks.Modern model.

## Projected Components

Modern projected transaction rows use exactly these component values:

```text
modern.base.sys
modern.base.epad
modern.peak.sys
modern.peak.epad
```

Canonical names such as `base.sys`, `base.epad`, `allocation.peak.sys`, `allocation.peak.epad`, `peak.sys`, and `peak.epad` are source rows, not projected component values.

## Value Preservation

Modern projection preserves canonical value by dimension:

```text
canonical_value = base_value + peak_value
projected_value = modern_base_value + modern_peak_value
```

Modern base price is carried from the canonical base component for each dimension. Modern peak price is residual so canonical value is preserved after base volume is projected.

Negative modern peak MW is valid and can produce residual prices that preserve value.
