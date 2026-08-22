# Decisions

> **Append-only log.** One entry per decision that was *reversible and actually
> debated* — the ones where a future reader (human or agent) would otherwise
> re-litigate settled ground, or silently undo something load-bearing. Newest
> first. Never rewrite an entry: if a decision is reversed, add a new entry and
> mark the old one **Superseded**, so the reasoning trail survives.
>
> Not for: settled invariants (those belong in `CLAUDE.md`), routine refactors,
> or anything the code already states plainly.

Each entry: **what was decided**, **why**, and **what would reverse it** — the
last one matters most, because it tells you when to reopen the question.

---

<!-- ── TEMPLATE — copy for each new entry, newest at the top ──────────────────

## YYYY-MM-DD — Short imperative title

**Decided.** The choice, stated plainly enough that someone can act on it
without reading the rest.

**Why.** The reasoning, including the alternative that was rejected and what
made it lose. If a measurement drove the decision, put the number here — a
number is what stops the question being reopened on a hunch.

**What would reverse it.** The concrete trigger that should make someone reopen
this. "Nothing — this is a security floor" is a valid answer.

Optional:
**Superseded:** what this replaces, and where that older thing is recorded.
**Note.** A gotcha this decision created, or a constraint it imposes elsewhere.

───────────────────────────────────────────────────────────────────────────── -->

## YYYY-MM-DD — (example, delete me) Chose X over Y for the job queue

**Decided.** Background jobs run on X. Y was evaluated and rejected.

**Why.** Y's per-worker overhead was the deciding factor: measured ~200ms
startup per job against X's ~5ms, and this workload is many short jobs rather
than few long ones. Y remains the better choice for the opposite shape.

**What would reverse it.** Job duration growing to the point where startup
overhead stops mattering, or needing a feature only Y has (scheduled retries
with backoff windows).

**Note.** X has no built-in dead-letter queue — failures are logged and dropped.
If that becomes a problem, that's the gap to close, not a reason to switch.
