# Commercial add-ons

## Purpose of this section

Explain how commercial fees and premiums are represented in the target model.

## Notes and requirements for the section

- Explain that add-ons are customer components.
- Explain that add-ons are not folded into hedge price.
- Explain that add-ons normally do not create market legs.
- Explain fee, Q-term and P-agent separately.
- Keep the section business-oriented and avoid PoC-only details unless clearly marked.
- Prices should remain per MWh.

## Current version of the text

Commercial add-ons should be represented as separate customer event details. This makes the hedge price, activity fees and product premiums visible and auditable instead of hiding them inside a single all-in price.

`fee.calloff` is a transaction activity fee. It is always positive and based on the absolute customer-facing volume in the calloff event. It does not follow the net position and does not become negative when the customer sells.

`premium.q_term` follows signed `modern.peak`. It is separate from the Q-factor itself. `premium.p_agent` is a customer premium that, in the simplified target documentation, can follow the same pattern as peak-linked premium logic unless a more detailed derivation is later introduced. All add-on prices remain per MWh.
