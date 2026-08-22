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

## 2026-08-22 — Use one append-only decisions log, not numbered ADRs

**Decided.** Project reasoning lives in a single `docs/decisions.md`, newest entry first. The `docs/adr/NNNN-slug.md` convention that arrived with the vendored `domain-modeling` skill was dropped, and that skill was rewritten to append here instead.

**Why.** Both conventions gated on the identical three-part test (hard to reverse, surprising without context, the result of a real trade-off), so running both meant two homes for one kind of knowledge and a coin-flip about which one a future session would read. The docs framework is the house standard across projects; the ADR convention arrived incidentally as a dependency of a skill vendored from an external repo. The framework's entry shape also carries **what would reverse it**, which the ADR template lacks and which is the field that actually stops a question being reopened.

**What would reverse it.** Needing per-context decision logs in a repo with several bounded contexts, where a single root file would mix unrelated domains. The `domain-modeling` skill still documents that layout (`src/<context>/docs/decisions.md`); it just isn't needed here.

**Note.** `CONTEXT.md` was left alone. It is a domain glossary, which the docs framework doesn't cover, so the two don't overlap.

## 2026-08-22 — TDD skill overrides the global no-autonomous-tests rule

**Decided.** `skills/test-driven-development` runs the test suite itself during the red/green loop, and says so explicitly in a "Running tests" section. This contradicts the global `~/.claude/CLAUDE.md` rule 4, which says to draft code and hand off rather than run test suites autonomously.

**Why.** The loop's whole value is watching the test fail for the right reason before writing code. Handing off at each red and each green turns a tight cycle into a many-turn conversation and loses the thing being verified. Conflict resolved in the skill's favour deliberately, and written into the file so it reads as an intentional override at runtime rather than an ambient contradiction between two loaded documents.

**What would reverse it.** Test suites in a target project getting slow or expensive enough that autonomous runs become the bottleneck.

**Note.** The compensating pause is **seam confirmation**: the skill blocks for user agreement on which seams to test before any test is written. That is the one approval gate; execution is not.

## 2026-08-22 — Merge the two candidate TDD skills instead of adopting one

**Decided.** `skills/test-driven-development` is a merge of obra/superpowers and mattpocock/skills rather than either one vendored whole. From obra: the Iron Law, the delete-your-code rule, the rationalization table, "name the break first". From mattpocock: the seam confirmation gate, the anti-pattern taxonomy, `tests.md` and `mocking.md`, and the deferral of refactoring to a review stage.

**Why.** They fail in opposite directions. obra's is enforcement-heavy but standalone and npm/TypeScript-flavoured, with no concept of agreeing seams up front. mattpocock's composes with `codebase-design` and `domain-modeling` (both already vendored here, sharing its vocabulary) but has no guardrail against an agent quietly skipping the loop. The rationalization table is the part that survives contact with an agent looking for an excuse.

**What would reverse it.** Either upstream skill absorbing the other's strengths, at which point tracking one directly costs less than maintaining a merge.

**Note.** Refactoring was moved out of the red/green loop as part of this. The skill now points users at `/code-review`, or `/thermo-nuclear-code-quality-review` for a deeper pass, rather than reshaping code mid-cycle. It points in prose because both of those refuse programmatic invocation.

## 2026-07-02 — Ship MCP servers as esbuild bundles

**Decided.** Each extension is bundled to a single `server/main.mjs` with all npm dependencies inlined, and `.mcp.json` points at the bundle rather than at `server/index.js`. `node_modules` is deleted before the zip is built.

**Why.** A two-sided constraint leaves no third option:

| Approach | Remote install | Runtime |
|---|---|---|
| Bundle `node_modules` into the zip | fails: `@`-scoped paths trip the "invalid characters" check | would work |
| Ship without `node_modules` | installs fine | fails: can't resolve `@modelcontextprotocol/sdk`, `zod`, `dotenv` |
| esbuild bundle to `main.mjs` | installs | works |

**What would reverse it.** The plugin loader accepting `@`-scoped paths, which would make plain `node_modules` viable and remove a build step.

**Note.** Phoenix is deliberately exempt: it launches via `npx -y @arizeai/phoenix-mcp` and self-installs. That makes it a useful canary, since it connects even when every local bundle is broken. Also note `${CLAUDE_PLUGIN_ROOT}` is the correct path variable here; `${__dirname}` belongs to Claude Desktop `.mcpb` manifests and is silently passed through as a literal string.
