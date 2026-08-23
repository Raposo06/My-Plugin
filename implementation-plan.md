# Multi-Email Expense Tracker — Implementation Plan

## Overview
An n8n workflow that scans 3 Gmail accounts daily for expense-related emails (receipts,
invoices, payment confirmations), extracts structured expense data using an LLM, stores it
in an n8n Data Table, and sends a monthly report email summarizing spend, categories, and
trends vs. the prior month.

## Architecture

Two independent workflows (or two triggers in one workflow) sharing a single Data Table:

1. **Daily Capture Workflow** — runs once/day, processes new expense emails across 3 Gmail
   accounts, writes rows to the Data Table.
2. **Monthly Report Workflow** — runs once/month (1st of month), reads last month's rows,
   normalizes currency, generates an LLM narrative summary, emails the report.

---

## 1. Daily Capture Workflow

**Trigger:** Schedule Trigger, once daily (e.g. 6am).

**Per Gmail account (x3), branch runs:**

1. **Gmail search** with a coarse keyword pre-filter, date-bounded to the last day:
   `after:<yesterday> subject:(receipt OR invoice OR payment OR order confirmation OR
   confirmação OR fatura) OR has:attachment`
2. **Dedup check:** for each returned message, look up `gmail_message_id` in the Data Table.
   Skip if already present (handles reruns/overlap — no Gmail label mutation needed).
3. **Extraction (LLM pass via OpenRouter credential):**
   - Primary: read email body (HTML/text) directly.
   - Fallback: if body lacks a parseable amount and the email has a PDF attachment, run
     n8n's "Extract from File" node on the attachment first, then feed that text to the LLM.
     Scanned/image-only PDFs are not OCR'd in v1 — treated as failed extraction.
   - LLM is prompted to return structured JSON: `merchant`, `amount`, `currency`, `date`,
     `category` (forced choice from fixed list below), `confidence`.
4. **Validation:** if `merchant`, `amount`, or `date` is missing/low-confidence, do NOT drop
   or guess — insert the row anyway with `status = needs_review` and whatever partial data
   was extracted, plus a link back to the Gmail message.
5. **Insert row** into Data Table (see schema below).

**Fixed category list** (editable later, just a prompt constraint):
`Subscriptions, Groceries, Dining/Takeout, Transport, Utilities, Shopping, Health, Housing, Other`

---

## 2. Monthly Report Workflow

**Trigger:** Schedule Trigger, 1st of each month, summarizing the previous calendar month.

**Steps:**
1. Query Data Table for all rows where `date` falls in the previous month.
2. Convert each row's `amount`/`currency` to EUR using a live/daily FX rate (e.g.
   exchangerate.host), computed at report-time (not stored back on the row — raw original
   amount/currency is never overwritten).
3. Aggregate: total EUR spend, breakdown by category (amount + % of total).
4. Pull previous month's totals (same query, shifted back one month) to compute trend deltas
   per category (flag any category that moved >20%).
5. Count/list rows with `status = needs_review`.
6. **LLM aggregation/narrative pass:** feed the categorized totals + trend deltas to an LLM
   to produce a short written summary (e.g. "Dining up 35% vs June, driven by 3 restaurant
   charges over €50"). This pass does NOT re-categorize — categories are already fixed from
   capture-time.
7. **Send email** via Gmail node, from and to `david.raposo06@gmail.com`, containing:
   - Total spend for the month (EUR)
   - Category breakdown table
   - Trend narrative vs. previous month
   - Needs-review count + links

---

## Data Table Schema

| Column             | Type    | Notes                                              |
|--------------------|---------|-----------------------------------------------------|
| `gmail_message_id`  | string  | unique key, used for dedup                          |
| `account`           | string  | which of the 3 Gmail accounts this came from        |
| `date`              | date    | expense/transaction date                            |
| `merchant`          | string  |                                                       |
| `amount`            | number  | original amount, as charged                         |
| `currency`          | string  | original currency (EUR/USD/...)                     |
| `category`          | string  | one of the fixed categories                          |
| `status`            | string  | `ok` \| `needs_review`                               |
| `email_link`        | string  | Gmail permalink to source message                    |
| `raw_snippet`        | string  | short excerpt for manual review context              |

*(EUR-normalized amount is computed at report-time, not persisted, so historical rows are
never "wrong" if you recompute later.)*

---

## Key Decisions Log

- **3 Gmail accounts**, OAuth-based Gmail nodes (no generic multi-provider IMAP in v1).
- **Filter first, extract second:** cheap Gmail search query narrows volume before any LLM
  call runs — controls cost and avoids scanning entire inboxes.
- **Body text is the primary extraction source; PDF attachments are a fallback branch.**
  Scanned/image-only PDFs are out of scope for v1 (flagged `needs_review`, no OCR).
- **n8n Data Table** is the source of truth — no external DB/spreadsheet needed for v1.
- **Daily batch via Schedule Trigger**, not live Gmail triggers — expenses aren't
  time-sensitive, and batch is easier to make idempotent and re-runnable.
- **Dedup via Gmail message ID lookup** against the Data Table before insert — no Gmail
  label mutation required.
- **Currency stored as-is; normalized to EUR only at report-generation time**, so raw data
  is never altered and historical reports can be recomputed with current FX logic later.
- **Categorization happens at capture-time** (fixed list, LLM-assigned per email) to keep
  categories consistent month-over-month. A *separate* LLM pass at report-time handles
  aggregation and narrative insight only — it does not invent or alter categories.
- **Low-confidence/failed extractions are never dropped or guessed** — always inserted with
  `status = needs_review` so the report's totals stay trustworthy and edge cases stay visible.
- **Report delivered via email** (Gmail send), from/to `david.raposo06@gmail.com`, monthly
  on the 1st, summarizing the previous month.
- Report content: total spend, category breakdown, trend vs. previous month (>20% moves
  flagged), needs-review count/links. Per-account breakdown is stored but not shown by
  default.

---

## Progress / State (as of 2026-07-12)

- ✅ Design finalized (this document).
- ✅ Data Table created: `Expense Tracker` (id `tl05h0mwXaCF9UXu`) in personal project
  `e0ySHiytqArvbeB3`, with columns: `gmail_message_id`, `account`, `expense_date`,
  `merchant`, `amount`, `currency`, `category`, `status`, `email_link`, `raw_snippet`.
- 🔄 Gmail OAuth2 credentials: **1 of 3 connected** (generic name "Gmail account", id
  `ATSQohTOdEoF7idu` — needs renaming to identify which of the 3 addresses it is, e.g.
  `Gmail - david.raposo06`). Google Cloud project set up with Gmail API enabled, scopes
  `gmail.readonly` + `gmail.send`, OAuth consent screen in Testing mode with the 3 target
  addresses as test users. Client ID/Secret already entered in n8n; same pair reused across
  all 3 credentials — just sign in with a different account each time (use incognito windows
  to avoid session conflicts).
- ⏳ Not yet started: the 2 remaining Gmail credentials, the Daily Capture workflow, the
  Monthly Report workflow.
- Existing OpenRouter credential (`OpenRouter account`, id `YqwK9WMIcemgjIeU`) and Telegram
  credential are unrelated to this project (used by the "Girlfriend Wake Up Message"
  workflow) but OpenRouter can be reused here for the LLM extraction/aggregation passes.

**Next action for whoever picks this up:** confirm all 3 Gmail credentials exist with
distinct names, then build the Daily Capture workflow per the node plan below using
`create_workflow_from_code` (SDK reference and best-practices docs for scheduling,
data_extraction, data_persistence, and triage have already been pulled once this session —
call `get_sdk_reference` and `get_workflow_best_practices` again if starting fresh).

**Daily Capture workflow — node plan:**
Schedule Trigger (daily) → 3 parallel Gmail (search) branches, one per account, date-bounded
query like `after:<yesterday> subject:(receipt OR invoice OR payment OR order confirmation)
OR has:attachment` → Data Table (`rowExists`) dedup check by `gmail_message_id`, skip if
already present → Information Extractor (LLM via OpenRouter) on email body text, falling back
to Extract from File (pdf operation) for PDF attachments when body has no parseable amount →
IF validation (merchant + amount + date all present and confident) → Data Table `insert` with
`status: ok`, or `insert` with `status: needs_review` and partial data + `email_link` if not.

## Build Steps (n8n MCP workflow)

1. `get_sdk_reference` + `get_workflow_best_practices` (techniques: email processing/triage,
   scheduling, data extraction) before writing any workflow code.
2. `search_nodes` for: Gmail (trigger/search/send), Schedule Trigger, Extract from File,
   OpenRouter/LLM node, Data Table node(s), HTTP Request (FX rate lookup), If/Filter, Merge.
3. `get_node_types` for every node selected above to get exact parameter shapes.
4. `create_data_table` with the schema above.
5. Set up Gmail OAuth credentials for all 3 accounts (currently missing — only Telegram +
   OpenRouter credentials exist today).
6. Build the Daily Capture workflow (3 account branches → merge → dedup → extract → validate
   → insert).
7. Build the Monthly Report workflow (query → FX convert → aggregate → LLM narrative →
   Gmail send).
8. `validate_workflow` + `test_workflow` on sample pinned data before `publish_workflow`.
