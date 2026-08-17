# Two-legged transaction model

## Purpose of this section

Explain the separation between customer-facing commercial truth and market-facing hedge/risk truth.

## Notes and requirements for the section

- Explain customer leg and market leg.
- Clarify that two-legged does not mean every event must have both legs.
- Explain why Baseloads normally has market hedge leg only.
- Explain why Modern/Peaks/Profile-like products need a customer leg.
- Explain that legs can have different components, volumes and prices.
- Explain that legs should be linkable.

## Current version of the text

The model separates customer-facing and market-facing truth into legs. The customer leg represents the commercial product position where it is needed. The market leg represents the hedge, risk and settlement position.

Some products need both legs. For example, a Modern/Peaks transaction may create `modern.peak` on the customer side and `market.base` on the market side. These rows are economically connected but not the same representation.

Baseloads is different. Baseloads is market-near, so the hedge exposure can normally be represented directly as market basis. In that case, there may be no customer hedge leg for the Baseloads exposure, while customer add-ons such as calloff fees can still be customer-leg details.
