# Operations

> Running the project, and the environment traps that have cost real time.
> Every trap here has been hit in practice.

## Run it

There is no dev server. The loop is: edit `foxcore-plugin/`, build, re-upload.

```powershell
# from the repo root
.\build-plugin.ps1
```

The script bundles each extension under `foxcore-plugin/extensions/` (npm install, esbuild to `server/main.mjs`, delete `node_modules`), zips `foxcore-plugin/` into `foxcore.plugin` at the repo root, then verifies the zip has no `node_modules/` entries and no `@`-scoped paths.

Then re-upload `foxcore.plugin` in the Claude desktop app. **The build alone changes nothing.** See the first trap.

## Traps

### Skill or MCP edits have no effect; the old version keeps loading

**Symptom:** you edit a `SKILL.md` in `foxcore-plugin/skills/`, start a new session, and the skill loads with its previous content. Or a newly added skill isn't listed at all. Nothing in the repo looks wrong.

**Cause:** the plugin runs from the **remote marketplace upload**, not this folder. Installing via the desktop app uploads the zip to your account marketplace and runs the remote copy. Confirmed in `%APPDATA%/Claude/logs/main.log`:

```
[CCD] … exists in both remote and local. Using remote.
```

The installed snapshot lives at `~/.claude/plugins/marketplaces/local-desktop-app-uploads/foxcore/` and only changes on re-upload.

**Fix:** rebuild and re-upload. Rebuilding locally, or `npm install`-ing into the installed folder, does nothing.

**Confirm** which copy is actually live by checking the file dates and skill list in the installed path:

```bash
ls -la ~/.claude/plugins/marketplaces/local-desktop-app-uploads/foxcore/skills
```

If that listing disagrees with `foxcore-plugin/skills/`, you are testing a stale plugin.

### Upload rejected: "Zip file contains path with invalid characters"

**Symptom:** the zip builds fine, the desktop app refuses it on upload.

**Cause:** `node_modules/@scope/…` paths. The loader rejects `@`-scoped paths anywhere in the archive.

**Fix:** this is why the servers are esbuild bundles. Never ship `node_modules` in the zip. `build-plugin.ps1` deletes it before zipping and warns if any `@` path survives.

### MCP server fails at runtime: cannot resolve `@modelcontextprotocol/sdk`

**Symptom:** plugin installs cleanly, but a server won't start; the log shows an unresolved bare import (`@modelcontextprotocol/sdk`, `zod`, `dotenv`).

**Cause:** the opposite failure from the one above. Shipping without `node_modules` installs fine but leaves `node server/index.js` unable to resolve its dependencies.

**Fix:** point `.mcp.json` at `server/main.mjs` (the esbuild bundle), never `server/index.js` (the source). Both constraints together are why bundling is non-optional; see the 2026-07-02 entry in [decisions.md](decisions.md).

### Only Phoenix connects; the other MCP servers are dead

**Symptom:** Phoenix MCP works, WikiJS / Cloudflare / Coolify all fail.

**Cause:** Phoenix launches via `npx -y @arizeai/phoenix-mcp` and self-installs, so it works regardless of bundling. The other three are local bundles.

**Use it as a canary:** if *only* Phoenix connects, the problem is the node bundles, not your credentials or the plugin manifest.

### Skill refuses to run: "cannot be used with Skill tool due to disable-model-invocation"

**Symptom:** an agent tries to call `improve-codebase-architecture` or `thermo-nuclear-code-quality-review` and gets a hard error telling it not to replicate the workflow by other means.

**Cause:** intentional. Both carry `disable-model-invocation: true` so they only fire when the user types the slash command. This is not a bug and should not be "fixed" by removing the flag.

**Fix:** run `/improve-codebase-architecture` or `/thermo-nuclear-code-quality-review` yourself. Other skills must refer users to them in prose, never call them.

### Build fails: output zip is locked

**Symptom:** `Compress-Archive` fails on a rebuild because `foxcore.plugin` is held open.

**Fix:** already fixed in `build-plugin.ps1` (commit `6d9b57b`). It compresses to a temp `foxcore.zip`, removes the old output, then moves the temp into place. If you rewrite the build script, keep that indirection.

## Verification

`build-plugin.ps1` self-verifies and prints the result. A healthy build:

- **Clean: no @-scoped paths, no node_modules.**
- Zip around 490 KB; individual bundles around 745 KB.

Any `WARNING` about `@`-scoped paths or `node_modules` means the upload will fail. Fix before uploading.

After uploading, confirm the skills actually resolve by invoking one and checking the base directory it reports.

## Data & state

Credentials are per-machine and not in the repo. Each extension reads its own `.env`, loaded by absolute path so the working directory doesn't matter:

```
extensions/wikijs-extension/.env      WIKIJS_URL, WIKIJS_API_TOKEN
extensions/cloudflare-extension/.env  CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_NAME, CLOUDFLARE_ACCOUNT_ID
extensions/coolify-extension/.env     COOLIFY_BASE_URL, COOLIFY_API_TOKEN
```

`.env` is gitignored. Whether any given machine has these filled in is a runtime fact, not a repo fact: a fresh clone has none of them.

**Exception, and it is a problem:** the n8n MCP server's bearer token is committed inline in `foxcore-plugin/.mcp.json` rather than read from `.env`. It ships inside every built `foxcore.plugin`. See the open item in [overview.md](overview.md).
