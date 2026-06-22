# P0011 function design

## New functions

### `ConfiguredHttpFuturesPriceProvider.fromText(text, sourceName)`

Purpose: create a futures/block provider from configured CSV or JSON text.
Inputs: source text and source name.
Outputs: provider backed by normalized block records.
Side effects: none.
Reason: allow tests and local file PoC without network.
Tests: annual system and EPAD parsing.

### `ConfiguredHttpFuturesPriceProvider.fromConfig(config)`

Purpose: fetch a configured public URL and create a provider.
Inputs: source URL and optional fetch implementation.
Outputs: provider backed by normalized block records.
Side effects: one caller-controlled HTTP request.
Reason: implement real-mode PoC source adapter without embedding URLs.
Tests: mocked HTTP failure gives provider error.

### `RealCurrencyProvider.fromResponse(data, sourceName)`

Purpose: parse Frankfurter-style or normalized JSON into a SEK currency provider.
Inputs: JSON data and source name.
Outputs: currency provider.
Side effects: none.
Reason: normalize open currency data to `currency.sek`.
Tests: parses SEK currency response.

### `RealCurrencyProvider.fromConfig(config)`

Purpose: fetch configured/open currency URL and create a provider.
Inputs: source URL and optional fetch implementation.
Outputs: currency provider.
Side effects: one caller-controlled HTTP request.
Reason: implement real-mode SEK adapter.
Tests: mocked source failure gives provider error.

### `createPriceApiFromProviderMode(options)`

Purpose: select fixture or real providers from environment-like configuration.
Inputs: environment object and optional fetch implementation.
Outputs: Price API instance.
Side effects: none in fixture mode; configured HTTP/file reads in real mode.
Reason: provide `PRICE_PROVIDER_MODE=fixture|real` entry point.
Tests: fixture mode still works; missing real config gives clear error.

### `runLiveCheck(env)`

Purpose: optional manual PoC check command.
Inputs: environment object.
Outputs: exit code.
Side effects: optional network/file read when configured.
Reason: manual low-volume verification without affecting tests.
Tests: not part of normal test suite.

## Changed functions

### `createPriceApi(providers)`

Change: no behavior change required; real providers satisfy existing interfaces.

## Removed functions

None.
