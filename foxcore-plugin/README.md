# Fox Core Plugin

A Claude Code plugin bundling David Raposo's self-hosted infrastructure tooling:

- **`Obsidian` MCP server** — connects to the [MCP Server](https://community.obsidian.md/plugins/mcp-server) community plugin running inside Obsidian (Streamable HTTP, `localhost:27123`).
- **`Cloudflare` MCP server** — read-only inspection of a Cloudflare zone (DNS, SSL, Tunnels, Zero Trust), from [`extensions/cloudflare-extension`](extensions/cloudflare-extension).
- **`Coolify` MCP server** — read-only inspection of a Coolify instance (servers, apps, databases, services), from [`extensions/coolify-extension`](extensions/coolify-extension).
- **`grill-me` skill** — adversarial design interview that stress-tests a plan before implementation.
- **`test-driven-development` skill** — red/green loop with seam confirmation and rationalization guardrails.
- **`codebase-design` skill** — deep-module vocabulary (module, interface, depth, seam, leverage, locality).
- **`domain-modeling` skill** — builds CONTEXT.md glossaries and appends to decisions.md.
- **`docs-framework` skill** — instantiates the three-tier docs framework into another project.
- **`improve-codebase-architecture` skill** — scans for deepening opportunities and renders an HTML report.
- **`thermo-nuclear-code-quality-review` skill** — aggressive maintainability audit.
- **`unslop` skill** — cuts AI tells from writing.

## Setup

Each MCP server is shipped as a **self-contained esbuild bundle** (`server/main.mjs`) with all
npm dependencies inlined — there is nothing to `npm install` at runtime. Credentials are read
from a per-extension `.env` file (loaded by the bundle via an absolute path, so the working
directory doesn't matter):

```
extensions/cloudflare-extension/.env  CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_NAME, CLOUDFLARE_ACCOUNT_ID
extensions/coolify-extension/.env     COOLIFY_BASE_URL, COOLIFY_API_TOKEN
```

Fill those in, then install/upload the plugin in Claude.

The `Obsidian` server is different: it's not a bundled extension, it's an HTTP client for the
[MCP Server](https://community.obsidian.md/plugins/mcp-server) community plugin, which must be
installed and running inside Obsidian first (Settings → Community plugins → MCP Server →
enable, note the port and token). `.mcp.json` reads the token from `${OBSIDIAN_MCP_TOKEN}`, a
real environment variable (not a `.env` file) that must be set wherever Claude Code runs.

## Building & packaging

See [`../docs/operations.md`](../docs/operations.md) for build commands, the rebuild loop, and the traps that cost time.

TL;DR: `.\build-plugin.ps1` from the repo root, then re-upload `foxcore.plugin` in the desktop app. The plugin runs from the remote copy, not this folder — rebuilding locally changes nothing until you upload.

## Components

| Component | Path |
|-----------|------|
| Manifest | `.claude-plugin/plugin.json` |
| MCP config | `.mcp.json` |
| grill-me skill | `skills/grill-me/SKILL.md` |
| test-driven-development skill | `skills/test-driven-development/SKILL.md` |
| codebase-design skill | `skills/codebase-design/SKILL.md` |
| domain-modeling skill | `skills/domain-modeling/SKILL.md` |
| docs-framework skill | `skills/docs-framework/SKILL.md` |
| improve-codebase-architecture skill | `skills/improve-codebase-architecture/SKILL.md` |
| thermo-nuclear-code-quality-review skill | `skills/thermo-nuclear-code-quality-review/SKILL.md` |
| unslop skill | `skills/unslop/SKILL.md` |
