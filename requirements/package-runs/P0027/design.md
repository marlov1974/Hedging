# P0027 Design

## Implementation Structure

1. Update canonical component aliases and metadata.
2. Update seed component sets, q-factor ranges and prices.
3. Update Forecast Hedge generation to write `peak.sys` and `peak.epad`.
4. Update Legacy Calloff List to read new peak rows and old aliases.
5. Update UI labels that currently expose `Premium`.
6. Update tests and durable docs.

## Compatibility

The alias map keeps:

```text
peak.premium.sys -> peak.sys
peak.premium.epad -> peak.epad
peak.modern.sys -> peak.sys
peak.modern.epad -> peak.epad
```

Old rows remain readable. New rows use `peak.sys` and `peak.epad`.

## Test Strategy

- Seed tests verify canonical Peaks components.
- Forecast Hedge tests verify new transaction component names and q-factors.
- Market projection tests verify `peak.*` is included by category.
- Legacy Calloff List tests verify value preservation and old alias reading.
