# decisions.md Format

Decisions live in a single append-only `docs/decisions.md`, newest entry first. Never rewrite an entry: if a decision is reversed, add a new entry and mark the old one **Superseded**, so the reasoning trail survives.

Create the file lazily: only when the first decision is recorded.

## Template

```md
## YYYY-MM-DD — Short imperative title

**Decided.** The choice, stated plainly enough that someone can act on it without reading the rest.

**Why.** The reasoning, including the alternative that was rejected and what made it lose. If a measurement drove the decision, put the number here.

**What would reverse it.** The concrete trigger that should make someone reopen this. "Nothing — this is a security floor" is a valid answer.
```

## Optional fields

Only include these when they add genuine value. Most entries won't need them.

- **Superseded**: what this replaces, and where that older entry is (date/title)
- **Note**: a gotcha this decision created, or a constraint it imposes elsewhere

## When to log a decision

All three of these must be true:

1. **Hard to reverse**: the cost of changing your mind later is meaningful
2. **Surprising without context**: a future reader will look at the code and wonder "why on earth did they do it this way?"
3. **The result of a real trade-off**: there were genuine alternatives and you picked one for specific reasons

If a decision is easy to reverse, skip it: you'll just reverse it. If it's not surprising, nobody will wonder why. If there was no real alternative, there's nothing to record beyond "we did the obvious thing."

### What qualifies

- **Architectural shape.** "We're using a monorepo." "The write model is event-sourced, the read model is projected into Postgres."
- **Integration patterns between contexts.** "Ordering and Billing communicate via domain events, not synchronous HTTP."
- **Technology choices that carry lock-in.** Database, message bus, auth provider, deployment target. Not every library: just the ones that would take a quarter to swap out.
- **Boundary and scope decisions.** "Customer data is owned by the Customer context; other contexts reference it by ID only." The explicit no-s are as valuable as the yes-s.
- **Deliberate deviations from the obvious path.** "We're using manual SQL instead of an ORM because X." Anything where a reasonable reader would assume the opposite. These stop the next engineer from "fixing" something that was deliberate.
- **Constraints not visible in the code.** "We can't use AWS because of compliance requirements." "Response times must be under 200ms because of the partner API contract."
- **Rejected alternatives when the rejection is non-obvious.** If you considered GraphQL and picked REST for subtle reasons, record it; otherwise someone will suggest GraphQL again in six months.
