# P0046 - Hedging server basic auth local secret

## Purpose

Add simple password protection to the Hedging server for internet exposure through router port forwarding.

The goal is bot protection for a private PoC server, not enterprise authentication.

## Requirements

1. Add HTTP Basic Auth to the Hedging server.
2. Read the password from `HEDGING_PASSWORD`.
3. If `HEDGING_PASSWORD` is set, require Basic Auth for server routes.
4. Accept any username; validate only the password.
5. If auth is missing or wrong, return `401 Unauthorized` and include `WWW-Authenticate`.
6. If `HEDGING_PASSWORD` is not set, keep current local development behavior.
7. Do not hardcode the password.
8. Do not commit the real password.
9. Add or verify `.gitignore` protection for local env files, for example `.env`, `.env.local`, and similar.
10. Add a local setup step where Codex asks the user for the password in the Codex chat/session, then stores it only on the Mac in a gitignored local env file.
11. The local env file should set `HEDGING_PASSWORD=<provided value>`.
12. The local env file must not be committed to GitHub.
13. Document how to start the Hedging server using the local password file.

## Codex local setup instruction

Before finishing this package, Codex should ask the user in the Codex chat/session:

```text
What password should the Hedging server use for Basic Auth?
```

After the user provides it, Codex should write it only to a local gitignored env file on the Mac, for example `.env.local`, and verify that git does not track the file.

Do not put the password in any requirement file, source file, test fixture, documentation committed to GitHub, PR body, commit message, or logs.

## Tests

Add tests for:

1. Missing auth is rejected when `HEDGING_PASSWORD` is set.
2. Wrong password is rejected.
3. Correct password is accepted.
4. Existing behavior is unchanged when `HEDGING_PASSWORD` is unset.
5. Auth response includes `WWW-Authenticate`.

## Non-goals

Do not add usernames, accounts, sessions, database login, OAuth, or HTTPS.

Do not store secrets in the repository.

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

Verify that the local env file containing the password is ignored and not staged.
