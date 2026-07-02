#!/usr/bin/env node

/**
 * Coolify MCP Server
 *
 * Exposes tools for inspecting a self-hosted Coolify instance: servers,
 * projects, applications, databases, services, and health status. Also
 * exposes three narrow write actions that only re-run existing
 * configuration — restart_application, restart_service, and
 * trigger_deployment. No config edits, no create/delete, no stop.
 *
 * Transport: stdio (required for .mcpb / Claude Desktop extensions).
 *
 * Configuration is read from environment variables, which Claude Desktop
 * populates from the extension's user_config at runtime:
 *   - COOLIFY_BASE_URL
 *   - COOLIFY_API_TOKEN
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CoolifyClient, CoolifyApiError } from "./coolify-client.js";

// Load credentials from the extension's local .env (sibling of server/).
config({ path: join(dirname(fileURLToPath(import.meta.url)), "../.env"), override: true });

const BASE_URL = process.env.COOLIFY_BASE_URL;
const API_TOKEN = process.env.COOLIFY_API_TOKEN;

if (!BASE_URL || !API_TOKEN) {
  console.error(
    "[coolify-mcp] Missing configuration. COOLIFY_BASE_URL and COOLIFY_API_TOKEN must be set."
  );
  process.exit(1);
}

const coolify = new CoolifyClient(BASE_URL, API_TOKEN);

const server = new McpServer({
  name: "coolify-mcp",
  version: "1.1.0",
});

/**
 * Wraps a tool handler so Coolify API errors come back as a clean,
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
        err instanceof CoolifyApiError
          ? `Coolify API error (status ${err.status ?? "n/a"}): ${err.message}`
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
  "list_servers",
  "List all servers registered in this Coolify instance.",
  {},
  safeHandler(() => coolify.listServers())
);

server.tool(
  "get_server",
  "Get details and resource usage for a specific Coolify server.",
  { uuid: z.string().describe("UUID of the server") },
  safeHandler(({ uuid }) => coolify.getServer(uuid))
);

server.tool(
  "list_projects",
  "List all projects in this Coolify instance.",
  {},
  safeHandler(() => coolify.listProjects())
);

server.tool(
  "get_project",
  "Get details for a specific Coolify project, including its environments and resources.",
  { uuid: z.string().describe("UUID of the project") },
  safeHandler(({ uuid }) => coolify.getProject(uuid))
);

server.tool(
  "list_applications",
  "List all applications across this Coolify instance.",
  {},
  safeHandler(() => coolify.listApplications())
);

server.tool(
  "get_application",
  "Get details for a specific application, including status and domains.",
  { uuid: z.string().describe("UUID of the application") },
  safeHandler(({ uuid }) => coolify.getApplication(uuid))
);

server.tool(
  "get_application_logs",
  "Get recent deployment/runtime logs for a specific application.",
  { uuid: z.string().describe("UUID of the application") },
  safeHandler(({ uuid }) => coolify.getApplicationLogs(uuid))
);

server.tool(
  "restart_application",
  "Restart a specific application. Re-runs it with its existing configuration — no config or data changes, equivalent to clicking Restart in the Coolify UI.",
  { uuid: z.string().describe("UUID of the application") },
  safeHandler(({ uuid }) => coolify.restartApplication(uuid))
);

server.tool(
  "list_databases",
  "List all databases managed by this Coolify instance.",
  {},
  safeHandler(() => coolify.listDatabases())
);

server.tool(
  "list_services",
  "List all one-click services deployed on this Coolify instance.",
  {},
  safeHandler(() => coolify.listServices())
);

server.tool(
  "restart_service",
  "Restart a specific one-click service. Re-runs it with its existing configuration — no config or data changes.",
  { uuid: z.string().describe("UUID of the service") },
  safeHandler(({ uuid }) => coolify.restartService(uuid))
);

server.tool(
  "trigger_deployment",
  "Trigger a new deployment for an application or service by UUID, redeploying its currently configured git ref/image. Equivalent to what happens automatically on a push-triggered webhook.",
  {
    uuid: z.string().describe("UUID of the application or service to deploy"),
    force: z.boolean().optional().default(false).describe("Force a rebuild without using the Docker build cache"),
  },
  safeHandler(({ uuid, force }) => coolify.triggerDeployment(uuid, force))
);

server.tool(
  "health_check",
  "Check whether the Coolify instance is reachable and healthy.",
  {},
  safeHandler(() => coolify.healthCheck())
);

// --- Start ---

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("[coolify-mcp] Server running on stdio.");
