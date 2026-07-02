# Coolify MCP — Claude Desktop Extension

A Node.js MCP server for inspecting a self-hosted [Coolify](https://coolify.io) instance, packaged as a **Claude Desktop extension** (`.mcpb`). Runs locally on Claude Desktop's built-in Node.js runtime — no separate hosting, no remote connector.

Mostly read-only, with three narrow write actions: `restart_application`, `restart_service`, and `trigger_deployment` — all of which only re-run existing configuration (equivalent to the Restart/Deploy buttons in the Coolify UI). No config edits, no create/delete, no stop actions are exposed.

## Tools

`list_servers`, `get_server`, `list_projects`, `get_project`, `list_applications`, `get_application`, `get_application_logs`, `restart_application`, `list_databases`, `list_services`, `restart_service`, `trigger_deployment`, `health_check`.

## Build

The built-in Node runtime does **not** run `npm install`, so dependencies must be bundled into the package before packing:

```bash
cd coolify-mcp
npm install            # installs deps into node_modules (gets bundled)
npx @anthropic-ai/mcpb pack   # produces coolify-mcp.mcpb
```

(`npm install -g @anthropic-ai/mcpb` first if you prefer `mcpb pack` / `mcpb validate` directly.)

## Install

1. Open **Claude Desktop → Settings → Extensions**.
2. **Install extension** and select the generated `coolify-mcp.mcpb`.
3. When prompted, enter:
   - **Coolify Base URL** — e.g. `http://localhost:8000` (no trailing slash)
   - **Coolify API Token** — generate one in Coolify under **Settings → API Tokens**
4. Enable the extension.

The token is stored as a `sensitive` user-config value and injected as the `COOLIFY_API_TOKEN` env var at launch; it is never written into the manifest.

## Local development

```bash
npm install
COOLIFY_BASE_URL=http://localhost:8000 COOLIFY_API_TOKEN=your-token npm run inspect
```

Opens the MCP Inspector so you can call each tool manually before bundling.

## Notes

Coolify API reference: https://coolify.io/docs/api-reference
