# Component vocabulary

## Standard configuration families

```text
Portfolio Hedging Products
Baseloads
Peaks.Classic
Peaks.Modern
Profiles.Classic
Profiles.Modern
```

## Role names

```text
Market
```

## Components

```text
base
sys
epad
base.sys
base.epad
base.classic.sys
base.classic.epad
peak
offpeak
allocation.peak
allocation.peak.sys
allocation.peak.epad
peak.classic.sys
peak.classic.epad
peak.sys
peak.epad
profile.peak
profile.15m
profile.sys
profile.epad
volume
volume.flex
fixed
currency.sek
adjustment.*
```

Deprecated aliases retained for compatibility:

```text
allocation.peak -> allocation.peak.sys and allocation.peak.epad
peak.modern.sys -> peak.sys
peak.modern.epad -> peak.epad
peak.premium.sys -> peak.sys
peak.premium.epad -> peak.epad
```

## PoC component families

Classic timeblock / energy-partition components:

```text
base.classic.sys
base.classic.epad
peak.classic.sys
peak.classic.epad
```

Modern canonical exposure components:

```text
allocation.peak.sys
allocation.peak.epad
base.sys
base.epad
peak.sys
peak.epad
profile.sys
profile.epad
volume
```

## Component categories

```text
allocation
base
peak
profile
volume
currency
adjustment
```

Market projection listens to `base`, `peak` and `profile`.

Customer projection listens to customer-relevant components except `adjustment`.

Internal projection listens to all components.

## Compatibility aliases

```text
PeaksModern -> Peaks.Modern
PeaksClassic -> Peaks.Classic
ProfilesModern -> Profiles.Modern
ProfilesClassic -> Profiles.Classic
allocation.peak -> allocation.peak.sys and allocation.peak.epad
peak.modern.sys -> peak.sys
peak.modern.epad -> peak.epad
peak.premium.sys -> peak.sys
peak.premium.epad -> peak.epad
```

## Model objects

```text
contract part
call-off
customer transaction
calendar
settlement view
```

## Rule

Product configuration names describe standard combinations. Component names describe reusable model parts.
