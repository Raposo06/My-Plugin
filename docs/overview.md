# Fox Core plugin

> **Maintenance:** kept in sync from the repo. Updated when something
> *meaningful* changes (architecture, stack, security model, major features, or
> implemented/remaining status) — not on every commit. Last reviewed: 2026-08-22.

A personal Claude Code plugin, plus the single-plugin marketplace that distributes it. It bundles self-hosted infrastructure MCP servers (Wiki.js, Cloudflare, Coolify) with a set of engineering-workflow skills, so the same tooling and working style follow David across every project.

## Index

- [Decisions](decisions.md) — **the decision log.** Every reversible choice that
  was actually debated, with what would reverse it. Read before reopening a
  settled question.
- [Operations](operations.md) — building, uploading, and the environment traps
  that have cost time. Read this before debugging a connection or wondering why
  an edit had no effect.

## How it works

`foxcore-plugin/` is the source. It is built into a zip, uploaded to the account marketplace, and **run from that remote copy**, never from this folder.

```
foxcore-plugin/          source of truth
  → build-plugin.ps1     esbuild bundles each extension, strips node_modules, zips
  → foxcore.plugin       ~490 KB zip at the repo root
  → upload in desktop app
  → ~/.claude/plugins/marketplaces/local-desktop-app-uploads/foxcore/   what actually runs
```

The local-versus-remote split is the single most important thing to know about this repo, and the cause of its most expensive trap. Edits are inert until re-upload.

Two structural constraints shape everything else, both covered in [decisions.md](decisions.md):

- MCP servers ship as **esbuild bundles**, because the loader rejects `@`-scoped paths in the zip but bare `node index.js` can't resolve dependencies without them.
- Skills are plain markdown and need no build step, but are still subject to the same upload gate.

## Stack

| Layer | Tech | Notes |
|---|---|---|
| Plugin manifest | `foxcore-plugin/.claude-plugin/plugin.json` | name, version, description |
| Marketplace manifest | `.claude-plugin/marketplace.json` | single entry pointing at `./foxcore-plugin` |
| MCP config | `foxcore-plugin/.mcp.json` | 6 servers; local ones use `${CLAUDE_PLUGIN_ROOT}` |
| Local MCP servers | Node, esbuild-bundled to `server/main.mjs` | Wiki.js, Cloudflare, Coolify |
| Remote MCP servers | HTTP / npx | n8n, Phoenix, OpenRouter |
| Skills | Markdown, `SKILL.md` + reference files | see below |
| Build | `build-plugin.ps1` (PowerShell) | bundles, zips, self-verifies |

## Skills

| Skill | Invocation | Purpose |
|---|---|---|
| `grill-me` | model or `/` | Adversarial design interview; works a decision tree in rounds |
| `test-driven-development` | model or `/` | Red/green loop with a seam-confirmation gate |
| `codebase-design` | model or `/` | Deep-module vocabulary (module, interface, depth, seam, leverage, locality) |
| `domain-modeling` | model or `/` | Builds `CONTEXT.md` and appends to `docs/decisions.md` |
| `docs-framework` | model or `/` | Instantiates this docs framework into another project |
| `unslop` | model or `/` | Strips AI tells from writing |
| `improve-codebase-architecture` | **`/` only** | Scans for deepening opportunities, renders an HTML report, hands off to `grill-me` |
| `thermo-nuclear-code-quality-review` | **`/` only** | Aggressive maintainability review of a branch |

The last two carry `disable-model-invocation: true` and refuse programmatic calls by design. Other skills refer users to them in prose rather than invoking them.

Four skills are vendored from [mattpocock/skills](https://github.com/mattpocock/skills): `codebase-design`, `domain-modeling`, and the mattpocock half of `test-driven-development`. They are copies, not a submodule, and have local modifications (notably the ADR-to-`decisions.md` rewrite). Upstream changes do not flow in automatically.

## Security model

Credentials for the three local MCP servers are read from per-extension `.env` files, gitignored and per-machine. Whether any given clone has them is a runtime fact; a fresh clone has none.

**Known gap:** the n8n server's bearer token is committed inline in `foxcore-plugin/.mcp.json` instead of coming from `.env`, so it is in git history and inside every built `foxcore.plugin`. Not yet remediated. Rotating it requires the token be moved out of the tracked file first, or it will simply be re-committed.

## Current state

**Implemented:** all six MCP servers wired; eight skills; PowerShell build with self-verification; docs framework adopted (this directory).

**Remaining:**
- Move the n8n bearer token out of `.mcp.json` and rotate it.
- Refresh `foxcore-plugin/README.md`. Its component table and skill list still describe the three deleted skills (`conkord-decision`, `infrastructure-doc`, `kb-linter`) and omit all eight current ones. Its "Building & packaging" section has now been superseded by [operations.md](operations.md).
- Re-upload the plugin. Everything from 2026-08-22 is in the repo but not in the running copy.
