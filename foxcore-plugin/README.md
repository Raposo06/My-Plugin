# Fox Core Plugin

A Claude Code plugin bundling David Raposo's self-hosted infrastructure tooling:

- **`WikiJS` MCP server** — runs the bundled Node server in [`extensions/wikijs-extension`](extensions/wikijs-extension) over stdio (read/write pages, search, assets).
- **`Cloudflare` MCP server** — read-only inspection of a Cloudflare zone (DNS, SSL, Tunnels, Zero Trust), from [`extensions/cloudflare-extension`](extensions/cloudflare-extension).
- **`Coolify` MCP server** — read-only inspection of a Coolify instance (servers, apps, databases, services), from [`extensions/coolify-extension`](extensions/coolify-extension).
- **`conkord-decision` skill** — logs a decision from the current work session as a sub-page under `conkord/decisions/`.
- **`infrastructure-doc` skill** — creates/updates a "My Infrastructure" page in Wiki.js from live Coolify + Cloudflare data.
- **`grill-me` skill** — adversarial design interview that stress-tests a plan before implementation.
- **`kb-linter` skill** — audits a markdown knowledge base for broken links, orphaned pages, and content rot.

## Setup

Each MCP server is shipped as a **self-contained esbuild bundle** (`server/main.mjs`) with all
npm dependencies inlined — there is nothing to `npm install` at runtime. Credentials are read
from a per-extension `.env` file (loaded by the bundle via an absolute path, so the working
directory doesn't matter):

```
extensions/wikijs-extension/.env      WIKIJS_URL, WIKIJS_API_TOKEN
extensions/cloudflare-extension/.env  CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_NAME, CLOUDFLARE_ACCOUNT_ID
extensions/coolify-extension/.env     COOLIFY_BASE_URL, COOLIFY_API_TOKEN
```

Fill those in, then install/upload the plugin in Claude.

## Building & packaging — read this before debugging connections

This is the hard-won context from a long debugging session. **The plugin runs from the remote
marketplace upload, not this local folder.** When you "install" via the desktop app it uploads
`foxcore.zip` to your account marketplace and runs the *remote* copy
(`[CCD] … exists in both remote and local. Using remote.` in `%APPDATA%/Claude/logs/main.log`).
Rebuilding locally or `npm install`-ing into the installed folder does **nothing** until you
re-upload.

The servers are bundled because of a two-sided constraint that otherwise makes them unloadable
remotely:

| Approach | Remote install | Runtime |
|----------|----------------|---------|
| Bundle `node_modules` into the zip | **fails** — `node_modules/@scope/…` paths trip the "Zip file contains path with invalid characters" check | would work |
| Ship without `node_modules` | installs fine | **fails** — bare `node index.js` can't resolve `@modelcontextprotocol/sdk`, `zod`, `dotenv` |
| **esbuild bundle → `main.mjs`** | **installs** (no `@`-scoped paths) | **works** (all deps inlined) |

So `.mcp.json` points at `server/main.mjs` (the bundle), not `server/index.js` (the source).
It uses `${CLAUDE_PLUGIN_ROOT}` — the plugin path variable. (`${__dirname}` is for Claude
*Desktop* `.mcpb` manifests only and is silently passed as a literal string here.) Phoenix is the
exception: it's launched via `npx -y @arizeai/phoenix-mcp` and self-installs, so it works
regardless of bundling — a useful canary (if only Phoenix connects, the node bundles are the
problem).

To rebuild after editing a server's source, from each extension dir:

```bash
npm install   # restore node_modules so esbuild can resolve deps (build-time only)
npx esbuild server/index.js --bundle --platform=node --format=esm --target=node18 \
  --banner:js="import { createRequire } from 'module'; const require = createRequire(import.meta.url);" \
  --outfile=server/main.mjs
rm -rf node_modules   # keep it out of the zip
```

Then zip the plugin folder (`Compress-Archive foxcore-plugin/* → foxcore.plugin`) and re-upload.
A healthy bundle is ~745 KB; the whole zip is ~490 KB with **zero** `node_modules` and **zero**
`@`-scoped paths.

## Components

| Component | Path |
|-----------|------|
| Manifest | `.claude-plugin/plugin.json` |
| MCP config | `.mcp.json` |
| Decision skill | `skills/conkord-decision/SKILL.md` |
| Infrastructure skill | `skills/infrastructure-doc/SKILL.md` |
| Grill-me skill | `skills/grill-me/SKILL.md` |
| KB linter skill | `skills/kb-linter/SKILL.md` |
