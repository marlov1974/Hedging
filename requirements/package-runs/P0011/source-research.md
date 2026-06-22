# P0011 source research

## Scope

This research is for proof-of-concept feasibility only. Production licensing, redistribution rights, SLA, long-term sourcing governance and procurement are out of scope.

No credentials, API keys, private URLs, cookies, session tokens, customer data or data dumps are stored in this repository.

## Candidate: EEX Nordic power futures pages and EEX Group DataSource

- Source name: EEX market data / EEX Group DataSource.
- URL or API documentation reference:
  - `https://www.eex.com/en/market-data/power/futures`
  - `https://www.eex.com/en/market-data/eex-group-datasource/end-of-day-prices`
- Access method: public web pages for product/market visibility; EoD data is described as file/API-like DataSource delivery.
- Credentials needed: public pages do not need credentials; DataSource access may require ordering or commercial access.
- Terms or usage concern if obvious: suitable for source discovery; production or complete historical price retrieval likely needs DataSource terms.
- Data format: public pages are HTML; DataSource is described as file-based data delivery.
- Instrument coverage: EEX lists Nordic power futures and related market data pages, potentially relevant for `base.sys` and EPAD/zonal futures discovery.
- Implementation recommendation: do not scrape aggressively. For PoC, implement a configured HTTP/file futures provider that can read a public CSV/JSON export if manually supplied. Do not embed EEX private endpoints or licensed data.

## Candidate: Nasdaq Nordic commodities market information

- Source name: Nasdaq Nordic commodities.
- URL or API documentation reference: `https://www.nasdaq.com/solutions/nordic-commodities`
- Access method: public web/product information; complete price data access may require market-data products.
- Credentials needed: likely not for public information pages; price data may require licensing.
- Terms or usage concern if obvious: production use needs licensing review.
- Data format: public web content; market-data product formats vary.
- Instrument coverage: Nordic power derivatives and related contracts.
- Implementation recommendation: keep as a research candidate only. Do not implement hidden or credentialed access in this package.

## Candidate: Frankfurter EUR/SEK exchange-rate API

- Source name: Frankfurter.
- URL or API documentation reference: `https://www.frankfurter.app/docs/`
- Access method: open HTTP API.
- Credentials needed: no API key for basic public API use.
- Terms or usage concern if obvious: acceptable for low-volume PoC; production needs source governance review.
- Data format: JSON.
- Instrument coverage: EUR base rates including SEK.
- Implementation recommendation: implement a real currency provider adapter that can parse Frankfurter-style JSON and normalize it into `currency.sek`.

## Recommendation

For P0011, implement:

- `ConfiguredHttpFuturesPriceProvider`: reads normalized futures/EPAD block data from a configured public URL or local file path. This avoids committing private endpoints or licensed data while proving the adapter path.
- `RealCurrencyProvider`: reads an open EUR/SEK JSON response, with Frankfurter as the default public PoC source.
- `PRICE_PROVIDER_MODE=fixture|real`: fixture mode remains deterministic; real mode requires futures source configuration and gives clear errors when missing.

This is PoC-only and not production-suitable.
