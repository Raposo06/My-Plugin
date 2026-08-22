---
name: docs-framework
description: Instantiate the three-tier docs framework (overview, decisions, operations) plus its CLAUDE.md contract into a project. Use when setting up project documentation, adopting the docs framework, or when the user asks for a decisions log or an operations/traps file.
---

# Docs framework

Three docs plus a `CLAUDE.md` contract, so a new session (human or agent) picks up context instead of re-deriving it.

```
docs/overview.md     live: what this is, how it works now
docs/decisions.md    append-only: why it is the way it is
docs/operations.md   how to run it, plus traps that cost time
```

**The `CLAUDE.md` block is the load-bearing piece.** The skeletons are shape; the block is what makes them get updated instead of rotting. If the user only adopts one thing, make it that.

Each file has a different rhythm, and mixing them is what makes docs rot:

| File | Rhythm | Failure if you get it wrong |
|---|---|---|
| `overview.md` | Rewritten, always describes now | Accumulates history, becomes a changelog nobody trusts |
| `decisions.md` | Appended, never rewritten | Reasoning gets overwritten; the same debate reopens yearly |
| `operations.md` | Extended, grows with scar tissue | Stays theoretical, documents what *might* break instead of what did |

## Instantiating

Template files live in [template/](template/). Copy them into the target project's `docs/`, then paste [template/CLAUDE-docs-section.md](template/CLAUDE-docs-section.md) into the project's `CLAUDE.md` and trim the table to the files actually created. A row pointing at a missing file is worse than no row.

**Do not stop at copying skeletons.** Empty templates rot faster than no docs. Fill them in the order below as part of the same session.

### For a project that already exists

The decisions already happened, and they are in the user's head and the git log. Don't reconstruct everything.

**1. Start with `operations.md`.** Cheapest and most immediately useful. Mine the build scripts, the README, and the last few painful commits. Write down what actually broke. Symptom first.

**2. Seed `decisions.md` from friction, not from history.** Add an entry when either is true:

- Someone caught themselves *explaining* why something is the way it is. That explanation is the entry.
- Someone almost changed something and then remembered why they couldn't.

Three good entries beat thirty reconstructed ones. Useful prompt for mining the first few: *"which choices in this project would someone reasonably try to 'improve' without knowing why they're that way?"*

**3. Write `overview.md` last.** Once the other two exist you know what belongs here versus what already moved out. Writing it first tends to duplicate the README.

**4. Paste the `CLAUDE.md` block and trim the table.**

### For a new project

Create `decisions.md` first and let the other two follow when there is something to put in them. Create lazily: a file with nothing in it is a liability.

## Two patterns worth keeping

**Classify facts by verifiability.** A *repo fact* is verifiable from the code and true for everyone. A *runtime fact* depends on the machine: what's installed, seeded, migrated, deployed. Docs that state runtime facts as global are how they start lying. State how to check instead:

> ~~"The database has 9 codes loaded."~~
> "9 codes are registered in the code. What's actually loaded is per-machine, check with `GET /codes`."

**Write traps symptom-first.** "The OS silently reserves some ports" is unfindable. The literal `bind: An attempt was made to access a socket in a way forbidden by its access permissions` is what someone will paste into a search.

## Scope

- **Not a replacement for the README.** README is how to get started. These are how it works, why, and how to operate it. When a README already carries hard-won operational detail, move it into `operations.md` and leave the README to onboarding.
- **Not API or schema docs.** If a generator can produce it (OpenAPI, typedoc), don't hand-maintain it.
- **Not a substitute for verifying.** Docs reduce re-derivation; they don't make a stale claim true.

## When it's overkill

A small or short-lived project doesn't need three files. Start with `decisions.md` alone: it's the one whose absence is felt later, because reasoning is the part that genuinely can't be recovered from the code. Add `operations.md` the first time a trap costs an afternoon. Add `overview.md` when the README starts trying to be one.

See [FRAMEWORK.md](FRAMEWORK.md) for the full rationale.
