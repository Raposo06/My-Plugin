/**
 * Wiki.js 2.x GraphQL API client.
 *
 * Methods throw Error on API-level problems so the tool layer can surface
 * clean messages to Claude. Uses the global fetch / FormData / Blob available
 * in Node 18+ (the extension runs on Claude Desktop's built-in Node).
 */

const GRAPHQL_PATH = "/graphql";
const UPLOAD_PATH = "/u";

const MIME_BY_EXT = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  webp: "image/webp",
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  json: "application/json",
};

function guessMime(filename) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export class WikiJSClient {
  constructor() {
    const url = process.env.WIKIJS_URL;
    const token = process.env.WIKIJS_API_TOKEN;
    if (!url || !token) {
      throw new Error("WIKIJS_URL and WIKIJS_API_TOKEN environment variables are required.");
    }
    this.baseUrl = url.replace(/\/+$/, "");
    this.token = token;
  }

  async #query(query, variables) {
    const res = await fetch(`${this.baseUrl}${GRAPHQL_PATH}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(variables ? { query, variables } : { query }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Wiki.js HTTP ${res.status}: ${text.slice(0, 300)}`);
    }

    const body = await res.json();
    if (body.errors) {
      const messages = body.errors.map((e) => e.message ?? String(e)).join("; ");
      throw new Error(`Wiki.js GraphQL error: ${messages}`);
    }
    return body.data;
  }

  // ----------------------------------------------------------------- //
  // Pages — read
  // ----------------------------------------------------------------- //

  async listPages(limit = 50) {
    const data = await this.#query(
      `query ListPages($limit: Int!) {
        pages {
          list(limit: $limit, orderBy: TITLE) {
            id path title description contentType isPublished createdAt updatedAt
          }
        }
      }`,
      { limit },
    );
    return data.pages.list;
  }

  async getPage(pageId) {
    const data = await this.#query(
      `query GetPage($id: Int!) {
        pages {
          single(id: $id) {
            id path title description content contentType isPublished locale
            tags { tag } createdAt updatedAt
          }
        }
      }`,
      { id: pageId },
    );
    const page = data.pages.single;
    if (page === null) {
      throw new Error(`Page ${pageId} not found.`);
    }
    return page;
  }

  async searchPages(query) {
    const data = await this.#query(
      `query SearchPages($query: String!) {
        pages {
          search(query: $query) {
            results { id path title description locale }
            totalHits
          }
        }
      }`,
      { query },
    );
    return data.pages.search.results;
  }

  // ----------------------------------------------------------------- //
  // Pages — write
  // ----------------------------------------------------------------- //

  async createPage({ title, path, content, description = "", locale = "en", tags = [], isPublished = true }) {
    const data = await this.#query(
      `mutation CreatePage(
        $title: String!
        $path: String!
        $content: String!
        $description: String!
        $locale: String!
        $tags: [String]!
        $isPublished: Boolean!
        $isPrivate: Boolean!
      ) {
        pages {
          create(
            title: $title
            path: $path
            content: $content
            description: $description
            locale: $locale
            tags: $tags
            isPublished: $isPublished
            isPrivate: $isPrivate
            editor: "markdown"
          ) {
            responseResult { succeeded errorCode slug message }
            page { id path title }
          }
        }
      }`,
      {
        title,
        path: path.replace(/^\/+/, ""),
        content,
        description,
        locale,
        tags: tags ?? [],
        isPublished,
        isPrivate: false,
      },
    );
    const result = data.pages.create;
    if (!result.responseResult.succeeded) {
      throw new Error(
        `Failed to create page: ${result.responseResult.message} (code ${result.responseResult.errorCode})`,
      );
    }
    return result.page;
  }

  async updatePage({ pageId, title, content, description, tags, isPublished }) {
    // Fetch existing page to fill in required fields we're not changing.
    const existing = await this.getPage(pageId);

    const data = await this.#query(
      `mutation UpdatePage(
        $id: Int!
        $title: String!
        $content: String!
        $description: String!
        $tags: [String]!
        $isPublished: Boolean!
        $locale: String!
        $editor: String!
      ) {
        pages {
          update(
            id: $id
            title: $title
            content: $content
            description: $description
            tags: $tags
            isPublished: $isPublished
            locale: $locale
            editor: $editor
          ) {
            responseResult { succeeded errorCode message }
            page { id path title updatedAt }
          }
        }
      }`,
      {
        id: pageId,
        title: title ?? existing.title,
        content: content ?? existing.content,
        description: description ?? existing.description ?? "",
        tags: tags ?? (existing.tags ?? []).map((t) => t.tag),
        isPublished: isPublished ?? existing.isPublished ?? true,
        locale: existing.locale ?? "en",
        editor: existing.contentType ?? "markdown",
      },
    );
    const result = data.pages.update;
    if (!result.responseResult.succeeded) {
      throw new Error(
        `Failed to update page: ${result.responseResult.message} (code ${result.responseResult.errorCode})`,
      );
    }
    return result.page;
  }

  async deletePage(pageId) {
    const data = await this.#query(
      `mutation DeletePage($id: Int!) {
        pages {
          delete(id: $id) {
            responseResult { succeeded errorCode message }
          }
        }
      }`,
      { id: pageId },
    );
    const result = data.pages.delete.responseResult;
    if (!result.succeeded) {
      throw new Error(`Failed to delete page: ${result.message} (code ${result.errorCode})`);
    }
    return true;
  }

  // ----------------------------------------------------------------- //
  // Assets
  // ----------------------------------------------------------------- //

  async listAssets(folderId = 0) {
    const data = await this.#query(
      `query ListAssets($folderId: Int!) {
        assets {
          list(folderId: $folderId, kind: ALL) {
            id filename ext kind mime fileSize metadata createdAt updatedAt
            folder { id name }
          }
        }
      }`,
      { folderId },
    );
    return data.assets.list;
  }

  async uploadAsset({ filename, data, folderId = 0 }) {
    const mime = guessMime(filename);
    const form = new FormData();
    form.append("mediaUpload", JSON.stringify({ folderId }));
    form.append("mediaUpload", new Blob([data], { type: mime }), filename);

    const res = await fetch(`${this.baseUrl}${UPLOAD_PATH}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}` },
      body: form,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Asset upload failed — HTTP ${res.status}: ${text.slice(0, 300)}`);
    }

    return {
      filename,
      mime,
      size: data.length,
      url: `${this.baseUrl}/${filename}`,
    };
  }
}
