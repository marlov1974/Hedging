# P0002 - Product vocabulary documentation

## Purpose

Add documentation for generic standard configuration families and their component structure.

This is a documentation package. It does not add prototype code.

## Package type

Documentation package.

## Required work

Create small documentation files that describe:

1. Standard configuration families.
2. Shared component vocabulary.
3. Each standard configuration family in its own file.

Use generic names only.

## Target files

If the repository structure exists, place files under:

```text
docs/product-configurations/
```

If the structure does not exist yet, create the files in root and move them when P0001 has created the folder structure.

Required files:

```text
product_configurations.md
config_baseloads.md
config_peaks.md
config_profiles.md
config_fixed.md
component_vocabulary.md
```

## Standard configuration families

Use these names:

```text
Baseloads
Peaks
Profiles
Fixed
```

## Role names

Use:

```text
Market
```

## Component vocabulary

Allowed component names include:

```text
base
sys
epad
base.sys
base.epad
peak
offpeak
profile.peak
profile.15m
volume
volume.flex
fixed
calendar
contract part
call-off
customer transaction
settlement view
```

## Documentation rules

- Describe the model as a generic domain model.
- Do not explain why names are generic.
- Do not include mappings to any other names.
- Do not include real examples.
- Use only synthetic numbers if examples are needed.

## Verification

Confirm that:

- all files are small and focused,
- `REPOSITORY_FILES.md` is updated if files are added or moved,
- no non-generic product or organization names are introduced,
- the documentation links between the index file and each configuration file.
