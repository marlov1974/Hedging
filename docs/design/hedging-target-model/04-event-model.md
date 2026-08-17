# Event model

## Purpose of this section

Explain how business changes are represented as events with event details.

## Notes and requirements for the section

- Explain event as the business occurrence.
- Explain event detail as the atomic row.
- Explain signed rows: buys/increases positive, sells/reductions negative.
- Explain append-oriented history.
- Mention event types such as customer calloff, market rebalance, customer conversion and market-only adjustment.
- Make clear that history should not be rewritten except when correcting actual errors.

## Current version of the text

The model is event-based. Instead of updating a product table in place, the solution records business events and the event details created by those events. This makes the model auditable and allows later changes, corrections and migrations to be represented as new data rather than by rewriting history.

Event details are signed rows. A buy or increase is represented with a positive quantity. A sell or reduction is represented with a negative quantity. This makes it possible to calculate open positions, values and settlements from the same event history.

Events can represent different business processes, including customer calloffs, market rebalances, customer conversions and market-only adjustments. Historical rows should normally remain unchanged. If a position needs to be adjusted, moved or converted, the preferred method is to create new event details that explain the change.
