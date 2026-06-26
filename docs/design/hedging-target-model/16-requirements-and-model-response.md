# Requirements and model response

## Purpose of this section

List the business and architectural requirements behind the target model and explain how the model responds to them.

## Notes and requirements for the section

- State requirements first, then model response.
- Avoid presenting a design choice as the requirement itself.
- Include Classic migration and backward compatibility as explicit requirements.
- Include flexibility, history preservation, product moves, settlement, reporting and API support.
- Keep this as a bridge between business reasoning and design.

## Current version of the text

The model must separate customer commercial truth from market/risk truth. It addresses this by using customer and market legs where needed.

The model must support Baseloads as a market-near product. It addresses this by representing Baseloads hedge exposure in market basis and projecting Baseloads views from market canonical.

The model must support current Classic interfaces during migration. It addresses this by exposing Classic-compatible projections and APIs while avoiding Classic as the long-term canonical model.

The model must be flexible and future-proof. It addresses this through row-based components rather than product-specific wide tables.

The model must preserve history as an accounting-like principle. It addresses this through append-oriented events and event details.

The model must make product moves and hybrid products easier. It addresses this by separating market rebalance from customer conversion and by trading only market deltas where possible.

The model must keep existing market positions for the customer's account during product changes unless explicitly agreed otherwise. It addresses this by using current open market basis as the starting point for upgrade and downgrade logic.

The model must support transparent commercial fees and premiums. It addresses this by representing them as separate customer component rows.
