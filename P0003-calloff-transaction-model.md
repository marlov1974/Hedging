# P0003 - Call-off and transaction model documentation

## Purpose

Document the two-level data model for call-offs and monthly component transactions.

This is a documentation package. It does not add prototype code.

## Package type

Documentation package.

## Required work

Create small documentation files that describe:

1. Call-off as the parent object.
2. Transaction as the monthly component row.
3. The relationship between call-off name, contract part and customer transaction list.

Use generic names only.

## Target files

If the documentation structure exists, place files under:

```text
docs/data-model/
```

If the structure does not exist yet, create the files in root and move them when the folder structure exists.

Required files:

```text
calloff_model.md
transaction_model.md
customer_transaction_list.md
```

## Required concepts

A call-off stores parent-level information:

- call-off id
- contract part reference
- timestamp when the call-off was made
- actor / source that made the call-off
- optional aggregate values
- optional customer-visible instrument name
- lifecycle status

A transaction stores monthly component-level information:

- parent call-off reference
- delivery month
- component code
- quantity
- unit
- price
- price unit
- calendar basis
- derived MWh where applicable

## Naming requirement

The call-off level must support a customer-visible instrument name for transaction-list display.

Examples may use synthetic instrument names such as:

```text
BASEQ4-26
BASERYR-27
```

Do not include real or proprietary naming schemes.

## Verification

Confirm that:

- all files are small and focused,
- no non-generic product names are introduced,
- no real customer, organization, system, price or contract details are introduced,
- `REPOSITORY_FILES.md` is updated if files are added or moved.
