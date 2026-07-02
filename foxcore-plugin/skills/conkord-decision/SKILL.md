---
name: conkord-decision
description: "Record a decision made while working at Conkord as a new sub-page in the Wiki.js decisions log. Use when the user wants to log, document, capture, or write up a decision, design choice, tradeoff, or rationale from the current work session."
---

# Conkord Decision Logger

Capture a decision from the current work session and publish it as a new page in the Conkord wiki (Wiki.js, via the `WikiJS` MCP server).

## Wiki structure

- `conkord/` — the Conkord work-context root.
- `conkord/decisions` — the Decisions index page (numeric ID **133**). Wiki.js auto-lists child pages beneath it in the sidebar, so you do **not** need to edit the index.
- `conkord/decisions/<slug>` — **one page per decision**. This is what you create.

## Steps

1. **Reconstruct the decision from the conversation.** Look back over what was built or discussed in this session and identify:
   - *What* was decided (a single clear sentence).
   - *Why* it was needed (the problem or context).
   - *What alternatives* were considered and why they were rejected.
   - *What was chosen* and the reasoning.

   If any of these is genuinely unclear from the work so far, ask the user before writing — do not invent rationale.

2. **Pick a slug.** Lowercase kebab-case, short and specific, e.g. `wikijs-mcp-isprivate-fix`, `auth-provider-choice`. The full path is `conkord/decisions/<slug>` (no leading slash).

3. **Draft the page body** using the format below. Use today's actual date.

4. **Create the page** with the `WikiJS` MCP `create_page` tool:
   - `title`: a human-readable decision title.
   - `path`: `conkord/decisions/<slug>`.
   - `description`: one-line summary.
   - `content`: the Markdown body below.
   - Leave `is_published` at its default (`true`).

5. **Report back** the new page's path/URL so the user can open it.

## Page body format

```markdown
# <Decision title>

**Date:** YYYY-MM-DD
**Status:** Decided

## Decision
<One clear sentence: what was decided.>

## Context
<Why this came up — the problem, constraint, or trigger.>

## Options considered
- **<Option A>** — <why considered / why rejected>
- **<Option B>** — <why considered / why rejected>

## Choice & rationale
<What was chosen and the reasoning behind it.>

## Outcome
<Result, follow-ups, or "TBD" if not yet known.>
```

## Notes

- Ground every entry in actual work from the session — concrete files, errors, or tradeoffs that came up. Avoid generic filler.
- Keep one decision per page. If the session produced several distinct decisions, create a separate page for each.
