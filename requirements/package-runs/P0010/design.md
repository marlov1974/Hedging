# P0010 implementation design

## Package interpretation

Add a deterministic prototype database layer for customer, portfolio, forecast, calendar, product configuration, product configuration component and price component structures.

## Database approach

Use an in-memory database represented by typed Maps. This avoids external dependencies and keeps tests deterministic while still exercising schema creation, primary-key uniqueness, referential integrity and query composition.

## Implementation structure

- `src/database/types.ts`: entity input/output types and database error type.
- `src/database/schema.ts`: `createSchema` and in-memory database state.
- `src/database/validation.ts`: month, required string, numeric and component-code validation helpers.
- `src/database/repository.ts`: insert and query functions.
- `src/database/fixtures.ts`: synthetic fixture builder for tests and future prototype use.
- `tests/database/customerProductSchema.test.ts`: P0010 behavior tests.
- `docs/data-model/customer_product_database_structure.md`: generic table and relationship documentation.

## Validation strategy

Repository functions enforce package rules:

- primary-key uniqueness,
- unique customer number,
- foreign-key existence,
- repeated portfolio customer number matching linked customer,
- one forecast per portfolio and month,
- `YYYY-MM` month format,
- `peak_h <= total_h`,
- required currency,
- known component codes.

## Risks and assumptions

- IDs are supplied by callers because the package lists technical primary key fields but does not request auto-generation.
- `calendar_id` on portfolio is validated at insert time, so callers must insert calendar rows before portfolios.
- Component validation includes P0010 examples and the existing generic component vocabulary, including `currency.sek`.
