# P0053 consistency review

P0053 should clean read models without changing canonical storage:

- Data Viewer should expose raw customer legs, raw market legs, Modern customer canonical rows, Classic projection rows, Baseloads projection rows and market basis position rows as distinct read models.
- Modern position reporting should prefer Modern customer canonical event details when available.
- Classic position reporting should project from Modern customer canonical event details when available.
- Baseloads position/reporting and settlement should continue to use market basis read models.
- Existing transaction-derived helpers remain compatibility fallbacks and internal raw/debug helpers until P0054 decides what can be removed.
- Do not introduce new product migration, Q/profile adjustment, or storage semantics in this package.

All examples remain synthetic and generic.
