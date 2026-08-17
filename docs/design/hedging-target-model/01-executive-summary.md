# Executive summary

## Purpose of this section

Provide a short, business-readable summary of the target hedging information model.

## Notes and requirements for the section

- Explain why the model separates customer commercial truth from market/risk truth.
- Explain the event/event-detail approach without going into implementation details.
- Clarify that the model supports both current Classic needs and future product flexibility.
- Mention that Baseloads is market-near and projected from market basis.
- Mention that Modern is the customer basis for shaped products.
- Mention that Classic is a compatibility/projection layer, not the long-term source of truth.
- Keep this section concise enough for colleagues who only read the first page.

## Current version of the text

The target model separates the customer's commercial product position from the market-facing hedge, risk and settlement position. This is needed because some products are market-near, while others have customer-facing product shapes that differ from the way Markets needs to hedge and settle the exposure.

The model uses events and event details instead of product-specific wide tables. A business event can create customer-facing details, market-facing details, or both. Components such as base, peak, market base, fees and premiums are represented as rows with component codes.

The canonical model is deliberately separated from projections. Market basis is the canonical model for risk, settlement and Baseloads reporting. Modern is the customer-facing canonical basis for shaped products such as Peaks and Profile-like products. Classic remains supported as a compatibility and projection layer.

This design makes it possible to preserve history, move customers between products, support current interfaces during migration and add future product components without redesigning the core data model for every new product idea.
