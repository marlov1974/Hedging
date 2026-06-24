# P0042 - Value unit views and SEK reporting

## Purpose

Update Data Viewer, Classic/Modern projected views, Calloff Lists and Position Report to follow the normalized value/unit model introduced in P0041.

The package makes currency/component transactions visible in views and reports:

- raw Data Viewer rows expose normalized quantity, price and factor fields,
- projected Classic/Modern views retain `currency.eursek` as a currency row,
- customer-facing Classic/Modern reports can show SEK display values based on traded `currency.eursek` rows,
- partial or missing currency coverage is surfaced explicitly.

## Safety boundary

Keep all examples generic and public-safe. Do not add real customers, companies, internal product names, real contract terms, credentials, private feeds or raw market dumps.

## Required behavior

Raw/source views should show stored fields first:

```text
component_code
component_category
period
quantity
quantity_type
price
price_type
factor
factor_type
```

Derived fields must carry explicit units:

```text
hours
mwh
value_eur
q_value_eur
value_sek
coverage_pct
```

Currency rows must remain currency rows:

```text
component_code = currency.eursek
quantity_type  = EUR
price_type     = SEK_PER_EUR
```

They must not be projected into `classic.*` or `modern.*` power component names and must not contribute to projected MWh.

Classic/Modern Calloff List and Position Report should convert display values to SEK for SEK portfolios when matching `currency.eursek` rows exist. Missing or partial currency coverage must be visible through warning/status fields.

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

If tracked files are added, removed or moved, update `REPOSITORY_FILES.md` to match `git ls-files`.
