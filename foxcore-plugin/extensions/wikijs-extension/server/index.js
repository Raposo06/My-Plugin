#!/usr/bin/env node
/**
 * Wiki.js MCP server — stdio entry point for the Claude Desktop extension.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { WikiJSClient } from "./wikijs.js";

// Load credentials from the extension's local .env (sibling of server/).
config({ path: join(dirname(fileURLToPath(import.meta.url)), "../.env"), override: true });

const client = new WikiJSClient();

const server = new McpServer(
  { name: "wikijs-mcp", version: "0.1.0" },
  {
    instructions:
      "You are connected to a Wiki.js 2.x instance. Use list_pages or search_pages to " +
      "find pages, get_page to read content, create_page / update_page to write, " +
      "delete_page to remove, and list_assets / upload_asset for files. Always confirm " +
      "page IDs before destructive operations.",
  },
);

/** Wrap a tool handler: serialise its result to text, surface errors cleanly. */
const wrap = (fn) => async (args) => {
  try {
    const result = await fn(args);
    const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
    return { content: [{ type: "text", text }] };
  } catch (err) {
    return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
  }
};

// ------------------------------------------------------------------- //
// Read / Search
// ------------------------------------------------------------------- //

server.registerTool(
  "list_pages",
  {
    description:
      "List pages in the Wiki.js instance, ordered by title. Returns id, path, title, " +
      "description, published status, and timestamps. Use this to browse available pages " +
      "before fetching a specific one.",
    inputSchema: { limit: z.number().int().min(1).max(500).default(50) },
  },
  wrap(({ limit }) => client.listPages(limit)),
);

server.registerTool(
  "get_page",
  {
    description:
      "Fetch the full content and metadata of a single wiki page by its numeric ID. " +
      "Returns title, path, Markdown content, description, tags, locale, and timestamps.",
    inputSchema: { page_id: z.number().int() },
  },
  wrap(({ page_id }) => client.getPage(page_id)),
);

server.registerTool(
  "search_pages",
  {
    description:
      "Full-text search across all pages in the wiki. Returns matching pages with their " +
      "id, path, title, and description. Use this to find pages when you don't know the ID.",
    inputSchema: { query: z.string() },
  },
  wrap(async ({ query }) => {
    const results = await client.searchPages(query);
    return results.length ? results : [{ message: `No pages found matching '${query}'.` }];
  }),
);

// ------------------------------------------------------------------- //
// Create / Update / Delete
// ------------------------------------------------------------------- //

server.registerTool(
  "create_page",
  {
    description:
      "Create a new page in the Wiki.js instance. Content should be Markdown. The path " +
      "determines the URL (e.g. 'engineering/onboarding'). Returns the new page's id, path, title.",
    inputSchema: {
      title: z.string(),
      path: z.string(),
      content: z.string(),
      description: z.string().default(""),
      locale: z.string().default("en"),
      tags: z.array(z.string()).default([]),
      is_published: z.boolean().default(true),
    },
  },
  wrap(({ title, path, content, description, locale, tags, is_published }) =>
    client.createPage({ title, path, content, description, locale, tags, isPublished: is_published }),
  ),
);

server.registerTool(
  "update_page",
  {
    description:
      "Update an existing wiki page. Only supply the fields you want to change; omitted " +
      "fields keep their current values. Provide the numeric page ID.",
    inputSchema: {
      page_id: z.number().int(),
      title: z.string().optional(),
      content: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      is_published: z.boolean().optional(),
    },
  },
  wrap(({ page_id, title, content, description, tags, is_published }) =>
    client.updatePage({ pageId: page_id, title, content, description, tags, isPublished: is_published }),
  ),
);

server.registerTool(
  "delete_page",
  {
    description:
      "Permanently delete a wiki page by its numeric ID. This action is irreversible — " +
      "confirm the page ID before calling.",
    inputSchema: { page_id: z.number().int() },
  },
  wrap(async ({ page_id }) => {
    await client.deletePage(page_id);
    return { success: true, deleted_page_id: page_id };
  }),
);

// ------------------------------------------------------------------- //
// Assets
// ------------------------------------------------------------------- //

server.registerTool(
  "list_assets",
  {
    description:
      "List uploaded assets (images, documents, files) in a wiki folder. Returns filename, " +
      "MIME type, file size, and timestamps. Default folder_id 0 is the root folder.",
    inputSchema: { folder_id: z.number().int().default(0) },
  },
  wrap(({ folder_id }) => client.listAssets(folder_id)),
);

server.registerTool(
  "upload_asset",
  {
    description:
      "Upload a file (image, PDF, document, etc.) to the wiki's asset library. The file " +
      "content must be provided as a base64-encoded string. Returns filename, MIME, size, URL.",
    inputSchema: {
      filename: z.string(),
      data_base64: z.string(),
      folder_id: z.number().int().default(0),
    },
  },
  wrap(({ filename, data_base64, folder_id }) =>
    client.uploadAsset({ filename, data: Buffer.from(data_base64, "base64"), folderId: folder_id }),
  ),
);

const transport = new StdioServerTransport();
await server.connect(transport);
