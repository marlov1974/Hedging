# Market basis and Q-factor logic

## Purpose of this section

Explain how customer product components are translated to market basis.

## Notes and requirements for the section

- Explain market basis as the normalized market/risk representation.
- Explain that Baseloads has Q = 1.
- Explain that Peaks/Profile-like products can have Q not equal to 1.
- Explain value preservation between customer and market basis.
- Distinguish Q-factor from Q-term.
- Explain that the factor used must be stored historically.

## Current version of the text

Market basis is the normalized representation used for market position, risk, netting and settlement. For market-near Baseloads exposure, the market basis is effectively the product representation. For shaped products, the customer product component must be translated into market basis.

For a peak-like component, Q-factor translates customer quantity and price into market quantity and price. The transformation should preserve value. If the customer quantity is multiplied by Q, the customer price is divided by Q when represented as market basis.

Q-factor is transformation logic. Q-term is a separate commercial customer premium. The two must not be confused. The Q-factor used for a transaction must be stored with the event detail when it was part of the decision, so historical rows are not recalculated from later factors.
