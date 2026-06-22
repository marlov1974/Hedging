# Price API v2 virtual blocks

Some quarter or month blocks may be unavailable.

V2 may create virtual blocks from wider blocks using documented relation tables.

## Quarter from year

```text
Q1 = 135% of annual price
Q2 = 75% of annual price
Q3 = 80% of annual price
Q4 = 110% of annual price
```

## Month distribution inside quarter

```text
Q1: Jan 38%, Feb 37%, Mar 25%
Q2: Apr 40%, May 32%, Jun 28%
Q3: Jul 25%, Aug 33%, Sep 42%
Q4: Oct 28%, Nov 34%, Dec 38%
```

## Rule

Virtual blocks must be marked as virtual and must reference the rule used to create them.

A virtual value must never look like a directly sourced value.
