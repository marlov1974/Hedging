# Profiles

Profiles are standard configurations that extend base and peak shape with finer profile and volume-risk components.

## Typical component structure

```text
base.sys
base.epad
profile.peak
profile.15m
volume
```

A capped variant may use:

```text
volume.flex
```

## Description

`profile.peak` is the correctable peak/offpeak shape component.

`profile.15m` is a finer profile component.

`volume` and `volume.flex` represent volume-risk handling.
