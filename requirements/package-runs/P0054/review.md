# P0054 consistency review

P0054 is a compatibility cleanup package, not a new model package:

- Keep deprecated component aliases readable only for older fixtures and targeted compatibility tests.
- Do not store deprecated aliases in new seed product configuration rows.
- Keep old transaction-derived projected model helpers where current Calloff List, debug Data Viewer functions or compatibility tests still need them.
- Do not expose old projected transaction paths as the primary Data Viewer path for Modern or Classic perspectives.
- Modern reports should prefer Modern customer canonical event details.
- Classic reports should prefer projection from Modern customer canonical event details.
- Baseloads reports and settlement should prefer market basis event details.
- Document the remaining compatibility surface and the target read-model sources clearly.

All examples remain synthetic and generic.
