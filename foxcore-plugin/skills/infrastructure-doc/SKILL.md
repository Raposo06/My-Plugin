---
name: infrastructure-doc
description: 'Create or update the "My Infrastructure" page in Wiki.js, documenting the Hetzner + Coolify + Cloudflare stack. Gathers live data from the Coolify and Cloudflare MCP servers and publishes a structured snapshot. Use when the user wants to document, refresh, snapshot, or write up their infrastructure / servers / hosting / DNS setup.'
---

# Infrastructure Documenter

Build (or refresh) a single **"My Infrastructure"** page in the Conkord wiki (Wiki.js, via the `WikiJS` MCP server) that captures the current state of the Hetzner → Coolify → Cloudflare stack. The data is pulled live from the `Coolify` and `Cloudflare` read-only MCP servers, so the page is a point-in-time snapshot.

## Wiki target

- **Path:** `infrastructure/my-infrastructure` (no leading slash).
- **Title:** `My Infrastructure`.
- One page, kept up to date in place — do **not** create dated copies.
- ⚠️ The bare path `infrastructure` is **already taken** by the hand-written "Foxcore Infrastructure" page (id 32) and must **never** be overwritten. Always use the `infrastructure/my-infrastructure` child path.

## Steps

1. **Locate the page.** Call `WikiJS` `search_pages` with query `My Infrastructure` (fall back to scanning `list_pages` for path `infrastructure/my-infrastructure`).
   - If a page at path `infrastructure/my-infrastructure` exists, note its numeric **page ID** — you will `update_page`.
   - If it does not exist, you will `create_page` at path `infrastructure/my-infrastructure`.
   - Do **not** match or touch the page at the bare `infrastructure` path (id 32, "Foxcore Infrastructure") — that is a different, hand-maintained page.

2. **Gather Cloudflare data** (read-only `Cloudflare` server). Skip any call that errors and note the gap in the page rather than failing:
   - `verify_token` — confirm the token works.
   - `get_zone` + `get_zone_settings` + `get_ssl_universal_settings` — zone name, plan, SSL/TLS mode.
   - `list_dns_records` — all DNS records (group A/AAAA/CNAME vs others in the table).
   - `list_tunnels` + for each, `get_tunnel_configuration` — tunnel names, status, ingress hostnames → services.
   - `list_access_applications` + `list_access_groups` — Zero Trust apps and groups, if any.

3. **Gather Coolify data** (read-only `Coolify` server). Skip-and-note on error:
   - `health_check` — instance reachability. **If this returns an HTML page containing "Cloudflare Access" / a login form** rather than JSON, the Coolify instance is gated behind Cloudflare Zero Trust Access and the API token cannot authenticate through it. Record this under **Gaps / notes** and skip the remaining Coolify calls. Fix: create a Cloudflare Access **service token** and have the Coolify connector send `CF-Access-Client-Id` / `CF-Access-Client-Secret` headers, **or** add a bypass policy for the `/api/*` path on the Coolify Access app.
   - `list_servers` + `get_server` per server — server names, Hetzner host, resource usage.
   - `list_projects` — projects.
   - `list_applications` — apps with their server/project, status, and FQDN.
   - `list_databases` — managed databases (record engine/name only, never credentials).
   - `list_services` — one-click services.

4. **Render the page body** using the format below. Use today's actual date for "Last updated". Cross-reference where you can — e.g. match a Cloudflare DNS record or tunnel ingress hostname to the Coolify app that serves it.

5. **Publish:**
   - **Update:** `update_page` with the page ID and the new `content` (leave other fields untouched).
   - **Create:** `create_page` with `title` `My Infrastructure`, `path` `infrastructure/my-infrastructure`, a one-line `description`, the `content`, and `tags` `["infrastructure", "hetzner", "coolify", "cloudflare"]`.

6. **Report back** the page path/URL and a one-line summary of what changed (e.g. "added 2 new apps, updated 3 DNS records").

## Page body format

```markdown
# My Infrastructure

**Last updated:** YYYY-MM-DD
**Stack:** Hetzner (compute) → Coolify (orchestration) → Cloudflare (DNS / edge / Zero Trust)

> Auto-generated snapshot via the `infrastructure-doc` skill. Edits made by hand may be overwritten on the next refresh.

## Servers (Hetzner via Coolify)
| Server | Host / IP | Status | CPU / RAM / Disk |
|--------|-----------|--------|------------------|
| ... | ... | ... | ... |

## Applications
| App | Project | Server | Status | URL |
|-----|---------|--------|--------|-----|
| ... | ... | ... | ... | ... |

## Databases & Services
| Name | Type | Server | Notes |
|------|------|--------|-------|
| ... | ... | ... | ... |

## Cloudflare — Zone
- **Zone:** <name> (<plan>)
- **SSL/TLS mode:** <mode>
- **Universal SSL:** <status>

## Cloudflare — DNS records
| Name | Type | Content | Proxied | TTL |
|------|------|---------|---------|-----|
| ... | ... | ... | ... | ... |

## Cloudflare — Tunnels
| Tunnel | Status | Ingress hostname → service |
|--------|--------|----------------------------|
| ... | ... | ... |

## Cloudflare — Zero Trust Access
| Application | Domain | Allowed groups |
|-------------|--------|----------------|
| ... | ... | ... |

## Gaps / notes
- <Anything that errored or was unreachable during this snapshot, with the reason.>
```

## Notes

- All three infra servers are **read-only** — this skill never deploys, restarts, edits DNS, or changes Cloudflare/Coolify state. It only reads and writes the wiki page.
- **Never write secrets** to the wiki: no API tokens, database passwords, connection strings, or private keys. Record only names, types, hostnames, and statuses.
- If a whole MCP server is unreachable (e.g. Coolify down), still write/update the page with the sections you could gather and list the rest under **Gaps / notes** — don't abort.
- Omit a Zero Trust / Tunnels section entirely if the account has none, rather than leaving an empty table.
