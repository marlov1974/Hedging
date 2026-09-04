# Restore from GitHub

Package: P0055

This file is the handoff note for continuing the generic hedging prototype from
a new machine.

## Source of truth

Use GitHub as the source of truth:

```text
https://github.com/marlov1974/Hedging.git
```

Current continuation branch:

```text
p0055-commercial-components-upgrade-conversion-implementation
```

Current continuation commit at the time this note was written:

```text
7ac141f P0055 implement commercial component conversion model
```

## Restore on a new Mac

```bash
mkdir -p ~/dev
cd ~/dev
git clone https://github.com/marlov1974/Hedging.git
cd Hedging
git switch p0055-commercial-components-upgrade-conversion-implementation
npm test
```

Expected verification:

```text
361 tests pass
0 tests fail
```

## Run locally

```bash
npm run hedging:tool -- --host 127.0.0.1 --port 5175
```

Then open:

```text
http://127.0.0.1:5175/hedging
```

## Run with Basic Auth

Set a runtime-only password. Do not commit the password.

```bash
export HEDGING_PASSWORD='<runtime-password>'
npm run hedging:tool -- --host 127.0.0.1 --port 5175
```

The username is ignored by the prototype; the password must match
`HEDGING_PASSWORD`.

## Temporary remote browser access

For a temporary HTTPS URL to the local prototype, use a tunnel in front of the
localhost server. One known working option is Cloudflare Quick Tunnel:

```bash
brew install cloudflared
export HEDGING_PASSWORD='<runtime-password>'
npm run hedging:tool -- --host 127.0.0.1 --port 5175
cloudflared tunnel --url http://127.0.0.1:5175
```

Open the generated `https://*.trycloudflare.com/hedging` URL from the other
computer and authenticate with the runtime password.

Quick Tunnel URLs are temporary and can change after restart. For durable access,
create a named tunnel or use another managed remote-access setup.

## Codex continuation checklist

Before changing files after restore:

1. Read `README.md`.
2. Read `AGENTS.md`.
3. Run `git status --short --branch`.
4. Run `git fetch --all --prune`.
5. Read `memory/bootstrap-manifest.json` and its `read_order`.
6. Read the active package under `requirements/packages/`.
7. Write a short consistency review before implementation changes.

