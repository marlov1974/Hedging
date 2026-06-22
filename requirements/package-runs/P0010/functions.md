# P0010 function design

## New functions

### `createSchema()`

Purpose: create an empty deterministic in-memory database.
Inputs: none.
Outputs: database state with typed entity maps.
Side effects: none.
Reason: package requires schema creation support without an existing database layer.
Tests: create schema successfully.

### `insertCustomer(database, input)`

Purpose: insert a customer and enforce customer id and customer number uniqueness.
Inputs: database and customer input.
Outputs: inserted customer.
Side effects: mutates database state.
Reason: support customer master data.
Tests: insert customer and reject duplicate customer number.

### `insertCalendar(database, input)`

Purpose: insert a calendar row and validate month/hour rules.
Inputs: database and calendar input.
Outputs: inserted calendar.
Side effects: mutates database state.
Reason: portfolio and forecast calculations need calendar references.
Tests: insert calendar and reject `peak_h > total_h`.

### `insertCustomerPortfolio(database, input)`

Purpose: insert a portfolio linked to an existing customer and calendar.
Inputs: database and portfolio input.
Outputs: inserted portfolio.
Side effects: mutates database state.
Reason: model customer portfolios and price area.
Tests: insert portfolio and reject unknown customer.

### `insertCustomerForecast(database, input)`

Purpose: insert one monthly forecast per portfolio.
Inputs: database and forecast input.
Outputs: inserted forecast.
Side effects: mutates database state.
Reason: store monthly MWh and peak share.
Tests: insert forecast and reject duplicate month.

### `insertProductConfiguration(database, input)`

Purpose: insert a standard product configuration.
Inputs: database and product input.
Outputs: inserted product configuration.
Side effects: mutates database state.
Reason: support configured products.
Tests: insert product configuration with components.

### `insertProductConfigurationComponent(database, input)`

Purpose: insert a component under a product configuration.
Inputs: database and product component input.
Outputs: inserted component.
Side effects: mutates database state.
Reason: model product component composition.
Tests: insert component and reject unknown product or unknown component code.

### `insertPriceComponent(database, input)`

Purpose: insert a price row linked to a product configuration component.
Inputs: database and price component input.
Outputs: inserted price component.
Side effects: mutates database state.
Reason: model component prices and currencies.
Tests: insert price component and reject unknown component or missing currency.

### `getCustomerPortfolioWithForecasts(database, portfolioId)`

Purpose: return a portfolio with linked customer, calendar and sorted forecasts.
Inputs: database and portfolio id.
Outputs: aggregate object or undefined.
Side effects: none.
Reason: package requires portfolio query support.
Tests: query portfolio with forecasts.

### `getProductConfigurationWithComponents(database, productId)`

Purpose: return a product configuration with components and linked price components.
Inputs: database and product id.
Outputs: aggregate object or undefined.
Side effects: none.
Reason: package requires product configuration query support.
Tests: query product configuration with components and price components.

## Removed functions

None.
