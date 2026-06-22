# Price API sources

The Price API uses provider adapters.

## Futures price provider

The futures provider supplies latest annual derivative prices.

V1 requirements:

```text
base.sys annual price
base.epad annual price
supported area code: STO
```

The provider may be licensed, manual or file-based in early prototypes.

Credentials and private source URLs must not be committed.

## Currency provider

The currency provider supplies the currency rate used by the API response.

Currency is separate from energy component prices.

## Provider metadata

Each response should be able to expose or log:

```text
provider_name
source_timestamp
retrieved_at
instrument_code
```

## Rule

Provider selection is configuration, not product logic.
