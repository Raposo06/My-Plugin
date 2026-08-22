## docs/ — keep it in sync

`docs/` is the **source of truth** for how this solution works and why it is the
way it is. Prefer reading it over re-deriving from code, and prefer extending it
over letting knowledge live only in a commit message or a chat transcript.

| File | Update cadence |
|---|---|
| `docs/overview.md` | **Live** — keep current |
| `docs/decisions.md` | **Append** a dated entry whenever a reversible choice is made or reversed |
| `docs/operations.md` | Update when the run/deploy flow changes, or a new environment trap is diagnosed |

**Keep `docs/overview.md` current.** Update it whenever something *meaningful*
changes — architecture, stack, security model, major features, or
implemented/remaining status. Do **not** update for trivial changes (typos,
small refactors, dependency bumps, internal renames, test-only tweaks).

**Log decisions in `docs/decisions.md`.** Append a dated entry — *what was
decided, why, and what would reverse it* — whenever a reversible choice is made
or an earlier one is reversed. This is the file that stops a future session
re-litigating settled ground. It is **append-only**: mark a superseded entry,
never rewrite it.

**Write down environment traps in `docs/operations.md`.** If diagnosing
something cost more than a few minutes and would cost that again next time,
record the **symptom** alongside the fix — the symptom is what makes it findable.

**Distinguish repo facts from runtime facts.** A repo fact is verifiable from the
code and true for everyone (counts parsed from source, route definitions). A
runtime fact depends on the machine or deployment (what's installed, seeded,
deployed, running) and is **not** the same for every developer. Never state a
runtime fact as if it were global — say how to check it instead.

**Verify before asserting.** Docs reduce re-derivation; they don't replace
checking. Before stating that something exists, works, or is done — especially
across a context boundary or after time has passed — confirm it against the code
or a live check. Reporting a stale fact confidently is worse than saying "let me
check".

Do this proactively at the end of any change that meets the bar above — no need
to ask first; make the edit and mention it in your summary.
