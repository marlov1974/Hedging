# Peaks

Peaks are standard configurations that extend base exposure with a peak shape component.

## Typical component structure

```text
base.sys
base.epad
profile.peak
```

## Description

`profile.peak` represents peak/offpeak shape. It uses the peak calendar defined by the relevant contract part.

## Settlement principle

Call-offs may be represented in MW. Settlement is expressed in MWh.

Peak and offpeak settlement values are derived through calendar-based conversion.
