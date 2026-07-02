/**
 * Thin wrapper around the Cloudflare API v4.
 * Only implements read (GET) endpoints — this server is read-only by design.
 * Scoped to a single zone (resolved from a zone name, e.g. "foxcore.dev").
 *
 * Cloudflare API docs: https://developers.cloudflare.com/api/
 */

const API_BASE = "https://api.cloudflare.com/client/v4";

export class CloudflareApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "CloudflareApiError";
    this.status = status;
    this.body = body;
  }
}

export class CloudflareClient {
  /**
   * @param {string} apiToken - Cloudflare API token (My Profile > API Tokens)
   * @param {string} zoneName - e.g. "foxcore.dev"
   * @param {string} accountId - Cloudflare account ID (for Tunnels/Access endpoints)
   */
  constructor(apiToken, zoneName, accountId) {
    if (!apiToken) throw new Error("Cloudflare API token is required");
    if (!zoneName) throw new Error("Cloudflare zone name is required");

    this.apiToken = apiToken;
    this.zoneName = zoneName;
    this.accountId = accountId || null;
    this._zoneId = null; // resolved lazily on first call
  }

  async _get(path) {
    const url = `${API_BASE}${path}`;
    let response;

    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      throw new CloudflareApiError(
        `Could not reach Cloudflare API: ${err.message}`,
        null,
        null
      );
    }

    const body = await response.json().catch(() => null);

    if (!response.ok || body?.success === false) {
      const errs = body?.errors?.map((e) => e.message).join("; ");
      throw new CloudflareApiError(
        `Cloudflare API error for GET ${path}: ${errs || response.statusText}`,
        response.status,
        body
      );
    }

    return body;
  }

  /** Resolves and caches the zone ID for this.zoneName. */
  async _getZoneId() {
    if (this._zoneId) return this._zoneId;

    const result = await this._get(
      `/zones?name=${encodeURIComponent(this.zoneName)}`
    );
    const zone = result?.result?.[0];

    if (!zone) {
      throw new CloudflareApiError(
        `No zone found matching "${this.zoneName}" for this API token.`,
        404,
        result
      );
    }

    this._zoneId = zone.id;
    return this._zoneId;
  }

  _requireAccountId() {
    if (!this.accountId) {
      throw new CloudflareApiError(
        "This tool requires an account ID, but none was configured.",
        null,
        null
      );
    }
    return this.accountId;
  }

  // --- Token / account ---

  verifyToken() {
    return this._get("/user/tokens/verify");
  }

  async getAccount() {
    const accountId = this._requireAccountId();
    return this._get(`/accounts/${accountId}`);
  }

  // --- Zone ---

  async getZone() {
    const zoneId = await this._getZoneId();
    return this._get(`/zones/${zoneId}`);
  }

  async getZoneSettings() {
    const zoneId = await this._getZoneId();
    return this._get(`/zones/${zoneId}/settings`);
  }

  async getSslUniversalSettings() {
    const zoneId = await this._getZoneId();
    return this._get(`/zones/${zoneId}/ssl/universal/settings`);
  }

  // --- DNS records ---

  async listDnsRecords(type) {
    const zoneId = await this._getZoneId();
    const query = type ? `?type=${encodeURIComponent(type)}` : "";
    return this._get(`/zones/${zoneId}/dns_records${query}`);
  }

  async getDnsRecord(recordId) {
    const zoneId = await this._getZoneId();
    return this._get(`/zones/${zoneId}/dns_records/${encodeURIComponent(recordId)}`);
  }

  // --- Tunnels (account-scoped) ---

  async listTunnels() {
    const accountId = this._requireAccountId();
    return this._get(`/accounts/${accountId}/cfd_tunnel`);
  }

  async getTunnel(tunnelId) {
    const accountId = this._requireAccountId();
    return this._get(`/accounts/${accountId}/cfd_tunnel/${encodeURIComponent(tunnelId)}`);
  }

  async getTunnelConfiguration(tunnelId) {
    const accountId = this._requireAccountId();
    return this._get(
      `/accounts/${accountId}/cfd_tunnel/${encodeURIComponent(tunnelId)}/configurations`
    );
  }

  // --- Zero Trust Access (account-scoped) ---

  async listAccessApplications() {
    const accountId = this._requireAccountId();
    return this._get(`/accounts/${accountId}/access/apps`);
  }

  async listAccessGroups() {
    const accountId = this._requireAccountId();
    return this._get(`/accounts/${accountId}/access/groups`);
  }
}
