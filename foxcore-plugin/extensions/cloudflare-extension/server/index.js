#!/usr/bin/env node

/**
 * Cloudflare MCP Server (read-only, single zone)
 *
 * Exposes read-only tools for inspecting one Cloudflare zone: DNS records,
 * zone/SSL settings, Cloudflare Tunnels, and Zero Trust Access — plus a
 * couple of account/token sanity-check tools. No create/update/delete
 * actions are included by design.
 *
 * Transport: stdio (required for .mcpb / Claude Desktop extensions).
 *
 * Configuration is read from environment variables, which Claude Desktop
 * populates from the extension's user_config at runtime:
 *   - CLOUDFLARE_API_TOKEN
 *   - CLOUDFLARE_ZONE_NAME   (e.g. "foxcore.dev")
 *   - CLOUDFLARE_ACCOUNT_ID  (optional, required for Tunnels/Access tools)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CloudflareClient, CloudflareApiError } from "./cloudflare-client.js";

// Load credentials from the extension's local .env (sibling of server/).
config({ path: join(dirname(fileURLToPath(import.meta.url)), "../.env"), override: true });

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE_NAME = process.env.CLOUDFLARE_ZONE_NAME;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!API_TOKEN || !ZONE_NAME) {
  console.error(
    "[cloudflare-mcp] Missing configuration. CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_NAME must be set."
  );
  process.exit(1);
}

const cloudflare = new CloudflareClient(API_TOKEN, ZONE_NAME, ACCOUNT_ID);

const server = new McpServer({
  name: "cloudflare-mcp",
  version: "1.0.0",
});

/**
 * Wraps a tool handler so Cloudflare API errors come back as a clean,
 * model-readable error message instead of an uncaught exception.
 */
function safeHandler(fn) {
  return async (...args) => {
    try {
      const result = await fn(...args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      const message =
        err instanceof CloudflareApiError
          ? `Cloudflare API error (status ${err.status ?? "n/a"}): ${err.message}`
          : `Unexpected error: ${err.message}`;
      return {
        content: [{ type: "text", text: message }],
        isError: true,
      };
    }
  };
}

// --- Tools ---

server.tool(
  "verify_token",
  "Verify the configured Cloudflare API token and check its status/scope.",
  {},
  safeHandler(() => cloudflare.verifyToken())
);

server.tool(
  "get_account",
  "Get account-level details. Requires CLOUDFLARE_ACCOUNT_ID to be configured.",
  {},
  safeHandler(() => cloudflare.getAccount())
);

server.tool(
  "get_zone",
  "Get details for the configured zone: status, plan, nameservers.",
  {},
  safeHandler(() => cloudflare.getZone())
);

server.tool(
  "get_zone_settings",
  "Get all zone settings for the configured zone, including SSL mode, security level, and caching.",
  {},
  safeHandler(() => cloudflare.getZoneSettings())
);

server.tool(
  "get_ssl_universal_settings",
  "Get Universal SSL settings for the configured zone.",
  {},
  safeHandler(() => cloudflare.getSslUniversalSettings())
);

server.tool(
  "list_dns_records",
  "List DNS records for the configured zone, optionally filtered by record type (A, AAAA, CNAME, TXT, MX, etc).",
  { type: z.string().optional().describe("Optional DNS record type filter, e.g. 'A' or 'CNAME'") },
  safeHandler(({ type }) => cloudflare.listDnsRecords(type))
);

server.tool(
  "get_dns_record",
  "Get details for a single DNS record by its ID.",
  { record_id: z.string().describe("The Cloudflare DNS record ID") },
  safeHandler(({ record_id }) => cloudflare.getDnsRecord(record_id))
);

server.tool(
  "list_tunnels",
  "List Cloudflare Tunnels on the account. Requires CLOUDFLARE_ACCOUNT_ID to be configured.",
  {},
  safeHandler(() => cloudflare.listTunnels())
);

server.tool(
  "get_tunnel",
  "Get details for a specific Cloudflare Tunnel, including connector status. Requires CLOUDFLARE_ACCOUNT_ID.",
  { tunnel_id: z.string().describe("The Cloudflare Tunnel ID") },
  safeHandler(({ tunnel_id }) => cloudflare.getTunnel(tunnel_id))
);

server.tool(
  "get_tunnel_configuration",
  "Get the ingress configuration for a remotely-managed Cloudflare Tunnel. Requires CLOUDFLARE_ACCOUNT_ID.",
  { tunnel_id: z.string().describe("The Cloudflare Tunnel ID") },
  safeHandler(({ tunnel_id }) => cloudflare.getTunnelConfiguration(tunnel_id))
);

server.tool(
  "list_access_applications",
  "List Zero Trust Access applications on the account. Requires CLOUDFLARE_ACCOUNT_ID.",
  {},
  safeHandler(() => cloudflare.listAccessApplications())
);

server.tool(
  "list_access_groups",
  "List Zero Trust Access groups on the account. Requires CLOUDFLARE_ACCOUNT_ID.",
  {},
  safeHandler(() => cloudflare.listAccessGroups())
);

// --- Start ---

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("[cloudflare-mcp] Server running on stdio.");
