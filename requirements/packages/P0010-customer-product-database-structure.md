# P0010 - Customer and product database structure

## Purpose

Add customer, portfolio, forecast, calendar, product configuration and price component structures to the prototype database layer.

This is a coding package.

## Context

This package introduces the core customer/product data needed by later pricing, hedging and settlement flows.

We design the information model here. Codex implements it.

## Required objects

Implement database support for these objects:

```text
Customer
Customer Portfolio
Customer Forecast
Calendar
Product Configuration
Product Configuration Component
Price Component
```

Use the repository's existing TypeScript conventions. If no database layer exists yet, create a minimal local prototype database layer suitable for tests.

SQLite or an in-memory test database is acceptable for this prototype, as long as schema creation and test data are deterministic.

## Tables and fields

### Customer

```text
customer_id
name
customer_number
```

Rules:

- `customer_id` is the technical primary key.
- `customer_number` is the external/business customer number.
- `customer_number` must be unique.

### Customer Portfolio

```text
portfolio_id
customer_id
name
customer_number
price_area
calendar_id
```

Rules:

- `portfolio_id` is the technical primary key.
- `customer_id` references Customer.
- `customer_number` is repeated for convenience but must match the linked customer.
- `price_area` is required.
- `calendar_id` references Calendar.

### Customer Forecast

```text
forecast_id
portfolio_id
month
mwh
peak_pct
```

Rules:

- `portfolio_id` references Customer Portfolio.
- `month` uses `YYYY-MM`.
- `mwh` is monthly forecast volume in MWh.
- `peak_pct` is the share of monthly volume allocated to peak.
- One forecast row per portfolio and month.

### Calendar

```text
calendar_id
month
total_h
peak_h
```

Rules:

- `month` uses `YYYY-MM`.
- `total_h` is total hours in the month.
- `peak_h` is peak hours in the month.
- `peak_h` must be less than or equal to `total_h`.

### Product Configuration

```text
product_id
name
```

Rules:

- `product_id` is the technical primary key.
- `name` identifies the standard product configuration.

### Product Configuration Component

```text
productcomponent_id
product_id
name
component
productitem
```

Rules:

- `productcomponent_id` is the technical primary key.
- `product_id` references Product Configuration.
- `component` uses the component vocabulary, for example `base.sys`, `base.epad`, `profile.peak`, `profile.15m`, `currency.sek`.
- `productitem` identifies the configured item within the product configuration.

### Price Component

```text
pricecomponent_id
productcomponent_id
price
currency
```

Rules:

- `pricecomponent_id` is the technical primary key.
- `productcomponent_id` references Product Configuration Component.
- `price` is numeric.
- `currency` is required.

## Relationships

Required relationships:

```text
Customer 1..n Customer Portfolio
Customer Portfolio 1..n Customer Forecast
Customer Portfolio n..1 Calendar through calendar_id
Product Configuration 1..n Product Configuration Component
Product Configuration Component 1..n Price Component
```

## Required implementation

Create or extend modules for:

```text
schema creation
repository/data-access functions
seed fixtures
validation helpers
tests
```

Suggested paths, adapt if the repo already has better conventions:

```text
src/database/schema.ts
src/database/repository.ts
src/database/fixtures.ts
src/database/types.ts
tests/database/customerProductSchema.test.ts
```

## Required data-access behavior

Implement enough functions to support tests:

```text
createSchema
insertCustomer
insertCustomerPortfolio
insertCustomerForecast
insertCalendar
insertProductConfiguration
insertProductConfigurationComponent
insertPriceComponent
getCustomerPortfolioWithForecasts
getProductConfigurationWithComponents
```

## Validation rules

Reject:

- duplicate customer number,
- portfolio referencing unknown customer,
- forecast referencing unknown portfolio,
- forecast duplicate for same portfolio and month,
- invalid month format,
- calendar where peak_h > total_h,
- product component referencing unknown product,
- price component referencing unknown product component,
- missing currency,
- unknown component code if component vocabulary validation is available.

## Tests

Add tests for:

1. create schema successfully,
2. insert customer and portfolio,
3. reject duplicate customer number,
4. reject portfolio for unknown customer,
5. insert calendar and forecast,
6. reject duplicate forecast month for same portfolio,
7. reject calendar with peak_h greater than total_h,
8. insert product configuration with components,
9. insert price components,
10. query portfolio with forecasts,
11. query product configuration with components and price components.

## Documentation

Add a short documentation file:

```text
docs/data-model/customer_product_database_structure.md
```

It should explain the table purpose and relationships in generic terms.

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
- database approach used,
- tests added,
- tests run,
- test result,
- assumptions,
- `REPOSITORY_FILES.md` status.
