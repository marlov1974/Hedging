# P0011 implementation design

## Package interpretation

Add proof-of-concept real provider adapters behind the existing Price API abstractions while preserving deterministic fixture mode and tests.

## Provider mode design

- `PRICE_PROVIDER_MODE=fixture`: create the existing fixture-backed Price API.
- `PRICE_PROVIDER_MODE=real`: create configured futures/EPAD and currency providers.

Real mode requires one of:

- `PRICE_API_FUTURES_SOURCE_URL`: public CSV/JSON URL.
- `PRICE_API_FUTURES_SOURCE_FILE`: local CSV/JSON file path for manual PoC checks.

Currency uses `PRICE_API_CURRENCY_SOURCE_URL` when supplied and otherwise defaults to a Frankfurter-style EUR/SEK endpoint.

## Data normalization

Real futures provider input is normalized into block records with:

```text
component
price_area
block_type
block_id
start_month
end_month
price
currency
price_unit
retrieved_at
source_name
source_instrument
```

The provider exposes these blocks through the existing v1 annual futures and v2 block provider contracts.

## Test strategy

Tests use mocked HTTP responses and inline CSV/JSON text. No test makes a live internet call or requires credentials.

## Manual live check

Add `npm run price-api:live-check`. The command is safe when configuration is missing: it prints a clear message and exits without network calls.

## Risks and limitations

- Futures/EPAD provider is only as useful as the manually configured public source.
- The CSV parser is intentionally simple for PoC input, not a production CSV engine.
- Frankfurter-style currency parsing proves technical feasibility but production sourcing must be reviewed later.
