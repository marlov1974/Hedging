# P0046 implementation design

## Intended changes

- Add Hedging server Basic Auth helpers in `src/hedging/server.ts`.
- Capture `HEDGING_PASSWORD` when the server is created.
- Reject unauthenticated requests with `401 Unauthorized` and `WWW-Authenticate`.
- Keep local development behavior unchanged when `HEDGING_PASSWORD` is absent or empty.
- Add `.gitignore` protection for local env files.
- Document local startup through `.env.local` without committing secrets.

## Deliberate non-refactors

- Do not add accounts, usernames, sessions, cookies, OAuth or HTTPS.
- Do not add a dependency for env loading.
- Do not change the purchase server or price API server in this package.
- Do not store the password in tracked files.

## Test strategy

- Start the Hedging server on an ephemeral local port in tests.
- Verify missing and wrong Basic Auth are rejected when `HEDGING_PASSWORD` is set.
- Verify correct Basic Auth reaches the existing page.
- Verify no-auth local development still works when `HEDGING_PASSWORD` is unset.
- Verify the auth challenge header is present on `401` responses.
