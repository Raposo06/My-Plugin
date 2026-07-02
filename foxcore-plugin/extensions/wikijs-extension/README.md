# Wiki.js MCP — Claude Desktop Extension

A Node.js port of the Wiki.js MCP server, packaged as a **Claude Desktop extension** (`.mcpb`). It runs locally on Claude Desktop's built-in Node.js runtime — no separate hosting, no remote connector. This is the path that works when remote connectors are blocked by enterprise policy.

## Tools

`list_pages`, `get_page`, `search_pages`, `create_page`, `update_page`, `delete_page`, `list_assets`, `upload_asset` — feature parity with the Python server in [`../wikijs-mcp`](../wikijs-mcp).

## Build

The built-in Node runtime does **not** run `npm install`, so dependencies must be bundled into the package before packing:

```bash
cd wikijs-extension
npm install            # installs deps into node_modules (gets bundled)
npx @anthropic-ai/mcpb pack   # produces wikijs-mcp.mcpb
```

(`npm install -g @anthropic-ai/mcpb` first if you prefer `mcpb pack` / `mcpb validate` directly.)

## Install

1. Open **Claude Desktop → Settings → Extensions**.
2. **Install extension** and select the generated `wikijs-mcp.mcpb`.
3. When prompted, enter:
   - **Wiki.js URL** — e.g. `https://wikijs.foxcore.dev`
   - **API Token** — a Wiki.js token with read/write access.
4. Enable the extension.

The token is stored as a `sensitive` user-config value and injected as the `WIKIJS_API_TOKEN` env var at launch; it is never written into the manifest.
