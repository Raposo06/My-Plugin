# Operations

> Running the project, and the environment traps that have cost real time.
> Every trap here should have been hit in practice — this is not a list of
> things that might go wrong, it's a list of things that **did**.

## Run it

<!-- The shortest path from clean checkout to running. Exact commands, no prose
     the reader has to translate. Include the fast inner loop if it differs from
     the full stack. -->

```bash
# setup
# run
# verify it's up
```

| Service | Port | Notes |
|---|---|---|
| | | |

## Traps

<!-- ── The point of this section ─────────────────────────────────────────────
Write each trap SYMPTOM-FIRST. The fix is easy to find once you know what you're
looking at; the hard part is recognising the symptom. A heading like "Service X
reserves ports" is useless when what you actually see is an opaque bind error.

Keep the literal error text — that's what someone will paste into a search.
────────────────────────────────────────────────────────────────────────────── -->

### (example, delete me) Container starts but can't authenticate to its database

**Symptom:** every container reports healthy, but the app logs auth failures on
every query. Credentials in the env file look correct.

**Cause:** the database image applies its password **only** when initialising an
empty data volume. Changing the env file afterwards has no effect — the old
password persists in the volume.

**Fix** (destroys local data):
```bash
docker compose down -v
docker compose up -d
```

**Confirm** the container actually carries the intended value rather than
assuming:
```bash
docker inspect <container> --format "{{range .Config.Env}}{{println .}}{{end}}"
```

## Verification

<!-- What to run before considering a change done. -->

```bash
# tests
# type-check / lint
```

## Data & state

<!-- OPTIONAL — keep only if the project has seeded/ingested/migrated state.

     Be explicit about which facts are per-machine. Anything that depends on
     what THIS developer has run locally is not a project-wide fact, and stating
     it as one is how docs start lying. Give the command to check instead. -->
