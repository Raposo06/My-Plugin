/**
 * Thin wrapper around the Coolify v1 REST API.
 * Mostly read (GET) endpoints, plus three narrow write actions that only
 * re-run existing configuration — restart_application, restart_service, and
 * trigger_deployment. No config edits, no create/delete, no stop.
 *
 * Coolify API docs: https://coolify.io/docs/api-reference
 */

export class CoolifyApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "CoolifyApiError";
    this.status = status;
    this.body = body;
  }
}

export class CoolifyClient {
  /**
   * @param {string} baseUrl - e.g. https://coolify.example.com (no trailing slash)
   * @param {string} apiToken - Coolify API token (Settings > API Tokens)
   */
  constructor(baseUrl, apiToken) {
    if (!baseUrl) throw new Error("Coolify base URL is required");
    if (!apiToken) throw new Error("Coolify API token is required");

    this.baseUrl = baseUrl.replace(/\/+$/, ""); // strip trailing slash
    this.apiToken = apiToken;
  }

  async _get(path) {
    const url = `${this.baseUrl}/api/v1${path}`;
    let response;

    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          Accept: "application/json",
        },
      });
    } catch (err) {
      throw new CoolifyApiError(
        `Could not reach Coolify instance at ${this.baseUrl}: ${err.message}`,
        null,
        null
      );
    }

    const text = await response.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    if (!response.ok) {
      throw new CoolifyApiError(
        `Coolify API returned ${response.status} for GET ${path}`,
        response.status,
        body
      );
    }

    return body;
  }

  async _post(path, query) {
    const url = new URL(`${this.baseUrl}/api/v1${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) url.searchParams.set(key, value);
      }
    }

    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          Accept: "application/json",
        },
      });
    } catch (err) {
      throw new CoolifyApiError(
        `Could not reach Coolify instance at ${this.baseUrl}: ${err.message}`,
        null,
        null
      );
    }

    const text = await response.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    if (!response.ok) {
      throw new CoolifyApiError(
        `Coolify API returned ${response.status} for POST ${path}`,
        response.status,
        body
      );
    }

    return body;
  }

  // --- Servers ---

  listServers() {
    return this._get("/servers");
  }

  getServer(uuid) {
    return this._get(`/servers/${encodeURIComponent(uuid)}`);
  }

  // --- Projects ---

  listProjects() {
    return this._get("/projects");
  }

  getProject(uuid) {
    return this._get(`/projects/${encodeURIComponent(uuid)}`);
  }

  // --- Applications ---

  listApplications() {
    return this._get("/applications");
  }

  getApplication(uuid) {
    return this._get(`/applications/${encodeURIComponent(uuid)}`);
  }

  getApplicationLogs(uuid) {
    return this._get(`/applications/${encodeURIComponent(uuid)}/logs`);
  }

  restartApplication(uuid) {
    return this._post(`/applications/${encodeURIComponent(uuid)}/restart`);
  }

  // --- Databases ---

  listDatabases() {
    return this._get("/databases");
  }

  // --- Services ---

  listServices() {
    return this._get("/services");
  }

  restartService(uuid) {
    return this._post(`/services/${encodeURIComponent(uuid)}/restart`);
  }

  // --- Deployments ---

  triggerDeployment(uuid, force = false) {
    return this._post("/deploy", { uuid, force: force ? "true" : undefined });
  }

  // --- Health ---

  healthCheck() {
    return this._get("/health");
  }
}
