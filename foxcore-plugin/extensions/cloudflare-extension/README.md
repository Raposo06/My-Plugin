# Cloudflare MCP — Claude Desktop Extension

A Node.js MCP server for read-only inspection of a single Cloudflare zone (`foxcore.dev`), packaged as a **Claude Desktop extension** (`.mcpb`). Runs locally on Claude Desktop's built-in Node.js runtime — no separate hosting, no remote connector.

No create, update, or delete actions are exposed — read-only by design.

## Tools

`verify_token`, `get_account`, `get_zone`, `get_zone_settings`, `get_ssl_universal_settings`, `list_dns_records`, `get_dns_record`, `list_tunnels`, `get_tunnel`, `get_tunnel_configuration`, `list_access_applications`, `list_access_groups`.

Tunnel and Access tools require an Account ID; everything else only needs the zone name + token.

## Cloudflare API token scopes

Create a token at **Cloudflare dashboard → My Profile → API Tokens** with:

- **Zone → Zone → Read**
- **Zone → DNS → Read**
- **Zone → SSL and Certificates → Read**
- **Account → Cloudflare Tunnel → Read** (if using Tunnel tools)
- **Account → Access: Apps and Policies → Read** (if using Access tools)

Scope the token to the `foxcore.dev` zone specifically rather than all zones.

## Build

The built-in Node runtime does **not** run `npm install`, so dependencies must be bundled into the package before packing:

```bash
cd cloudflare-mcp
npm install            # installs deps into node_modules (gets bundled)
npx @anthropic-ai/mcpb pack   # produces cloudflare-mcp.mcpb
```

## Install

1. Open **Claude Desktop → Settings → Extensions**.
2. **Install extension** and select the generated `cloudflare-mcp.mcpb`.
3. When prompted, enter:
   - **Cloudflare Zone (Domain) Name** — `foxcore.dev`
   - **Cloudflare API Token** — scoped token from above
   - **Cloudflare Account ID** — optional, only needed for Tunnel/Access tools
4. Enable the extension.

The token is stored as a `sensitive` user-config value and injected as the `CLOUDFLARE_API_TOKEN` env var at launch; it is never written into the manifest.

## Local development

```bash
npm install
CLOUDFLARE_API_TOKEN=your-token CLOUDFLARE_ZONE_NAME=foxcore.dev CLOUDFLARE_ACCOUNT_ID=your-account-id npm run inspect
```

Opens the MCP Inspector so you can call each tool manually before bundling.

## Notes

Cloudflare API reference: https://developers.cloudflare.com/api/
