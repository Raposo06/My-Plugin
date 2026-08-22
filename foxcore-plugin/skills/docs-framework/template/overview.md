# <Project name>

> **Maintenance:** kept in sync from the repo. Updated when something
> *meaningful* changes (architecture, stack, security model, major features, or
> implemented/remaining status) — not on every commit. Last reviewed: YYYY-MM-DD.

<!-- The LIVE file: what this is and how it works RIGHT NOW. If a section here
     describes the past, it belongs in decisions.md instead. Keep it an index —
     when a section grows past a screen, split it into its own file and link.  -->

One paragraph: what this does and for whom.

## Index

- [Decisions](decisions.md) — **the decision log.** Every reversible choice that
  was actually debated, with what would reverse it. Read before reopening a
  settled question.
- [Operations](operations.md) — running it, and the environment traps that have
  cost time.

## How it works

<!-- The shape of the system: the flow, and the few design points a newcomer
     can't infer from the file tree. Not a file-by-file tour — the code is
     better at that than prose. -->

```
input
  → step
  → step
  → output
```

## Stack

| Layer | Tech | Notes |
|---|---|---|
| | | |

## Security model

<!-- OPTIONAL. Keep if there's auth or anything with a threat model worth
     stating. Say what is enforced and WHERE the single enforcement point is —
     that's what stops someone adding a second, weaker one. -->

## Current state

**Implemented:** ...

**Remaining:**
- ...

<!-- Keep "Remaining" honest. An item that's actually done is worse than no list
     at all — it sends the next reader (or agent) to redo finished work. -->
