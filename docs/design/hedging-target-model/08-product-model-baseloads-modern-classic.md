# Product model: Baseloads, Modern and Classic

## Purpose of this section

Explain how the main product concepts map to the target information model.

## Notes and requirements for the section

- Explain Baseloads as a market-near product.
- Explain that Baseloads hedge exposure normally lives in the market leg.
- Explain Modern as customer canonical basis for shaped products.
- Explain Classic as current/legacy model and projection from Modern.
- Avoid saying that Baseloads is simply Modern with peak equal to zero.
- Explain that product names can remain business concepts even if they are not separate canonical tables.

## Current version of the text

Baseloads is treated as a market-near product. Its hedge exposure can normally be represented directly as market basis, and the Baseloads customer view can be projected from that market position.

Modern is the customer-facing basis for shaped products. It can represent a base component and a peak component explicitly. This is needed where the customer product position is not identical to the market basis used for hedge and settlement.

Classic is the current model and must remain supported during migration. In the target model, Classic is not the long-term source of truth. It is a projection and compatibility layer derived from Modern customer basis where needed.
