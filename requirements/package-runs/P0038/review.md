# P0038 — Requirements consistency review

Status: requirements handover only. Implementation and runtime validation remain for Codex on the Mac.

## Scope
One integrated local prototype in the existing Hedging application: B2C events,
one advisor call-off across ten resources, Modern/Classic transaction, position
and settlement reports, customer/market leg inspection and q-factor event chains.

## Consistency
Preserves canonical storage versus projected rows, resource attribution, full
market commitments, immutable trades with opposite entries, and window-level
pre-contract hedging. Synthetic examples only. No implementation artifacts or
uploaded business documents are copied into this change.

The new whole-volume w-factor must not be substituted blindly for old
component-specific q-factors. Customer q-term allocation into projections and
settlement needs a documented numerical reconciliation before the affected code.
Requirements section 11 identifies the remaining economic decisions.

## Validation of this documentation change
Reviewed against repository instructions, focused component/risk/settlement
memories, the June canonical baseline and September resource handover.
The ten-resource fixture sums to 750 MWh; a 50% call-off gives 375 physical MWh
and 437.7 equivalent MWh. At a synthetic price of 50 the component value is 21885.
Seventeen acceptance scenarios specify future implementation evidence.
No application tests or Mac demonstration have been performed for P0038.
