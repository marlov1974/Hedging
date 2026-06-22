# P0011 - Real market price providers

## Purpose

Extend the Price API so it can fetch real market prices from internet-accessible sources instead of only synthetic fixtures.

This is a coding package with a required research step.

## Context

Earlier packages created fixture-based Price API providers. This package must keep the existing provider abstraction and add real provider adapters behind the same interface.

We design the requirement here. Codex researches and implements.

## Scope

Research and implement internet-based providers for:

```text
base.sys futures prices
base.epad futures prices
currency.sek
```

The provider may use:

```text
open API
public downloadable files
web crawler
```

Use the safest and most stable source available.

## Hard constraints

Do not commit:

```text
credentials
API keys
private URLs
cookies
session tokens
real customer data
licensed data dumps
```

If the best futures price source requires credentials or paid licensing, do not bypass it. Instead implement a clean provider interface and document the limitation.

## Research task

Before implementation, create:

```text
requirements/package-runs/P0011/source-research.md
```

The research document must describe candidate sources for:

```text
system futures
EPAD futures
EUR/SEK or SEK currency component
```

For each candidate, document:

```text
source name
URL or API documentation reference
access method
whether it needs credentials
terms or usage concern if obvious
data format
instrument coverage
implementation recommendation
```

## Provider design

Keep fixture providers.

Add real providers without breaking existing tests.

Suggested provider names:

```text
RealFuturesPriceProvider
RealCurrencyProvider
```

If a real futures source cannot be implemented safely without credentials, implement:

```text
ConfiguredHttpFuturesPriceProvider
```

that reads a configured public URL or local file path from environment/config, but does not include real private values in the repository.

## Required behavior

The API must still support the existing fixture mode for deterministic tests.

Add provider selection, for example:

```text
PRICE_PROVIDER_MODE=fixture|real
```

If `real` mode is selected and source configuration is missing, return a clear configuration error.

## Data normalization

Real provider output must normalize into internal block records:

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

Then existing monthly and stacking logic should consume normalized block records.

## Currency

The base model remains EUR.

`currency.sek` remains a separate currency component.

For v1 of this real provider package, support SEK only.

## Tests

Do not make tests depend on live internet.

Add tests with mocked HTTP/file responses for:

1. provider parses annual system future into normalized `base.sys` block,
2. provider parses annual EPAD future into normalized `base.epad` block,
3. provider parses SEK currency response into `currency.sek`,
4. missing config in real mode gives clear error,
5. HTTP/source failure gives clear provider error,
6. fixture mode still works,
7. no real credentials are required for test execution.

## Optional manual script

It is acceptable to add a manual command for live verification, for example:

```text
npm run price-api:live-check
```

The command must be safe if configuration is missing and must not be part of the normal test suite.

## Documentation

Create or update:

```text
docs/price-api/real_price_providers.md
```

Document:

```text
provider modes
required environment variables
source limitations
how to run fixture tests
how to run optional live check
```

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

- selected source approach,
- source research summary,
- files changed,
- provider mode design,
- tests added,
- tests run,
- test result,
- any limitations,
- `REPOSITORY_FILES.md` status.
