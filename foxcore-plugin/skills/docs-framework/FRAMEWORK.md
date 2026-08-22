# docs framework

Three docs plus a `CLAUDE.md` contract, for keeping a project's knowledge in the
repo instead of in commit messages and chat transcripts — so a new session
(human or agent) picks up context instead of re-deriving it.

```
CLAUDE-docs-section.md   → paste into the project's CLAUDE.md   ← the real value
docs/overview.md         → live: what this is, how it works now
docs/decisions.md        → append-only: why it is the way it is
docs/operations.md       → how to run it + traps that cost time
```

**The `CLAUDE.md` block is the load-bearing piece.** The skeletons are shape; the
block is what makes them get updated instead of rotting. If you only adopt one
thing, adopt that.

## The three tiers

Each file has a different *rhythm*, and mixing them is what makes docs rot:

| File | Rhythm | Failure if you get it wrong |
|---|---|---|
| `overview.md` | **Rewritten** — always describes now | Accumulates history, becomes a changelog nobody trusts |
| `decisions.md` | **Appended** — never rewritten | Reasoning gets overwritten; the same debate reopens yearly |
| `operations.md` | **Extended** — grows with scar tissue | Stays theoretical, documents what *might* break instead of what did |

## Adopting it in a project that already exists

The hard part isn't the files — it's that the decisions already happened, and
they're in your head and the git log. Don't try to reconstruct everything.

**1. Start with `operations.md`.** Cheapest and most immediately useful. Write
down the last three things that made you swear at your terminal. Symptom first.

**2. Seed `decisions.md` from friction, not from history.** Don't archaeology the
whole repo. Add an entry when either happens:

- You catch yourself *explaining* why something is the way it is (to a colleague,
  to an agent, to yourself in a comment). That explanation is the entry.
- You almost changed something and then remembered why you couldn't.

Three good entries beat thirty reconstructed ones. A useful prompt for mining the
first few: *"which choices in this project would someone reasonably try to
'improve' without knowing why they're that way?"*

**3. Write `overview.md` last.** Once the other two exist you'll know what
belongs here versus what you already moved out. Writing it first tends to produce
a file that duplicates the README.

**4. Paste the `CLAUDE.md` block and trim the table** to the files you actually
created.

## Two patterns worth keeping

**Classify facts by verifiability.** A *repo fact* is verifiable from the code
and true for everyone. A *runtime fact* depends on the machine — what's
installed, seeded, migrated, deployed. Docs that state runtime facts as global
are how they start lying. State how to check instead:

> ~~"The database has 9 codes loaded."~~
> "9 codes are registered in the code. What's actually loaded is per-machine —
> check with `GET /codes`."

**Write traps symptom-first.** "The OS silently reserves some ports" is
unfindable. The literal `bind: An attempt was made to access a socket in a way
forbidden by its access permissions` is what someone will paste into a search.

## What this deliberately isn't

- **Not a replacement for the README.** README = how to get started. These = how
  it works, why, and how to operate it.
- **Not API/schema docs.** If a generator can produce it (OpenAPI, typedoc),
  don't hand-maintain it — it drifts and nobody notices.
- **Not a substitute for verifying.** Docs reduce re-derivation; they don't make
  a stale claim true. Confirm runtime state before asserting it.

## When it's overkill

A small or short-lived project doesn't need three files. Start with
`decisions.md` alone — it's the one whose absence you feel later, because the
reasoning is the part that genuinely can't be recovered from the code. Add
`operations.md` the first time a trap costs you an afternoon. Add `overview.md`
when the README starts trying to be one.
