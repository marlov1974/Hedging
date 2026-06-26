# Calloff flows

## Purpose of this section

Describe how different calloff types create event details in the target model.

## Notes and requirements for the section

- Cover Baseloads calloffs.
- Cover Modern/Peaks calloffs.
- Cover customer event details, market event details and add-on details.
- Explain SYS and EPAD/area separation.
- Keep this section conceptual and avoid UI-specific descriptions.

## Current version of the text

A Baseloads calloff is market-near. The hedge exposure normally creates market basis details, while customer add-ons such as `fee.calloff` can be created as customer details. A Baseloads hedge row does not normally need a separate customer hedge detail.

A Modern/Peaks calloff creates customer hedge details and market hedge details. The customer leg captures the commercial product shape, for example modern base and modern peak. The market leg captures the corresponding market basis position after applying the relevant transformation logic.

SYS and EPAD/area dimensions must remain separated throughout the calloff logic. They should not be blended into a single price or volume when they represent different economic layers.
