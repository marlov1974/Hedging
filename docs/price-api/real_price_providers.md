# Real price providers

## PoC boundary

P0011 is a proof of concept for low-volume manual testing. It is not production-suitable and does not solve production licensing, redistribution rights, SLA, long-term sourcing governance or procurement.

The repository must not contain credentials, API keys, private URLs, cookies, session tokens, customer data or source data dumps.

## Provider modes

```text
PRICE_PROVIDER_MODE=fixture
PRICE_PROVIDER_MODE=real
```

`fixture` is the default and uses deterministic synthetic providers.

`real` creates configured internet/file provider adapters.

## Required environment variables for real mode

Real futures and EPAD data require one of:

```text
PRICE_API_FUTURES_SOURCE_URL
PRICE_API_FUTURES_SOURCE_FILE
```

The source must provide normalized CSV or JSON block rows with:

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

Currency uses:

```text
PRICE_API_CURRENCY_SOURCE_URL
```

If not provided, the PoC uses a Frankfurter-style EUR/SEK JSON endpoint.

## Source limitations

The futures provider does not include private endpoints or licensed data. It reads only a caller-configured public URL or local file path.

The currency provider parses open EUR/SEK JSON responses such as Frankfurter-style `{ "rates": { "SEK": 11.2 } }`.

## Test command

```bash
npm test
```

Tests use mocked HTTP/file-like responses and do not call live internet.

## Optional live check

```bash
npm run price-api:live-check
```

If futures source configuration is missing, the command prints a clear configuration message and exits without performing a live check.

## Production changes needed

Production use would need licensed data review, source contracts, monitoring, retry/backoff policy, storage of retrieval evidence, audit controls, operational ownership and clear redistribution rules.
