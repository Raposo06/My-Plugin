---
name: test-driven-development
description: Test-driven development with confirmed seams, vertical slicing, and anti-cheating guardrails. Use when implementing a feature or bugfix test-first, when the user mentions TDD or red-green-refactor, or when a bug needs a reproducing test.
---

# Test-driven development

Two pillars:

1. **The Iron Law.** No production code without a pre-existing failing test.
2. **Testability by design.** Tests run against confirmed public seams, one vertical slice at a time.

When exploring the codebase, read `CONTEXT.md` (if it exists) so test names and interface vocabulary match the project's domain language, and respect `docs/decisions.md` entries for the area you are touching.

## Running tests

This skill runs the test suite itself during the loop. That is deliberate and it overrides the "draft and hand off, do not run test suites autonomously" rule in the global CLAUDE.md. The loop is worthless if nobody watches the test fail, and watching is the agent's job here.

The pause point is seam confirmation, not test execution. Get the seams agreed, then run the loop to completion without stopping for approval on each cycle.

## 1. The Iron Law

```
NO PRODUCTION CODE WITHOUT A PRE-EXISTING FAILING TEST.
```

Wrote production code before the test? Delete it. Start over.

- Do not keep it as "reference"
- Do not adapt it while writing the test
- Do not look at it

Delete means delete. Implement fresh from the test.

If you did not watch the test fail, the test does not count.

## 2. Seams: where tests go

A **seam** is the public boundary you test at: the interface where you observe behavior without reaching inside. Tests live at seams, never against internals.

**Test only at pre-agreed seams.** Before writing any test, write down the seams under test and confirm them with the user. No test is written at an unconfirmed seam. You cannot test everything, so agreeing the seams up front is how testing effort lands on critical paths and complex logic instead of every edge case.

Ask: "What is the public interface, and which seams should we test?"

When the shape of that interface is itself in question (how deep the module is, where the seam belongs, what the interface should expose), call the Skill tool with "codebase-design" for the vocabulary. It is the shared source of the module, interface, depth, seam, adapter, leverage and locality terms, and it is a reference to consult, not a session to run.

## 3. What a good test is

Tests verify behavior through public interfaces, not implementation details. Code can change entirely; tests should not. A good test reads like a specification: "user can checkout with valid cart" says exactly what capability exists, and it survives refactors because it does not care about internal structure.

**Name the break first.** Before writing the test body, answer: what production change should make this test fail, and is that change a bug or a decision? A test earns its place by catching a wrong branch, a missing side effect, a wrong argument, a boundary case, or a broken contract. If only an intentional decision could fail it, it is a change detector: it fires on redesign and sleeps through bugs.

**Derive expected values independently.** Use known-good literals, worked examples, or the spec. Never compute the expectation the way the code computes it.

See [tests.md](tests.md) for good and bad examples, and [mocking.md](mocking.md) for mocking guidelines.

## 4. Anti-patterns

- **Implementation-coupled.** Mocks internal collaborators, tests private methods, or verifies through a side channel (querying the database instead of using the interface). The tell: the test breaks when you refactor but behavior has not changed.
- **Tautological.** The assertion recomputes the expected value the way the code does (`expect(add(a, b)).toBe(a + b)`, a snapshot derived by hand the same way, a constant asserted equal to itself), so it passes by construction and can never disagree with the code.
- **Horizontal slicing.** Writing all the tests first, then all the implementation. Bulk tests verify *imagined* behavior: you test the *shape* of things rather than user-facing behavior, the tests go insensitive to real changes, and you commit to test structure before understanding the implementation. Work in **vertical slices** instead: one test, one implementation, repeat. Each test is a tracer bullet that responds to what the last cycle taught you.

## 5. The loop

```
[ Confirm seam ] -> [ RED ] -> [ verify red ] -> [ GREEN ] -> [ verify green ] -> [ next slice ]
```

### Step 0: Confirm the seam

Name the interface under test and get the user's agreement. This is the one blocking pause in the skill.

### Step 1: RED

Write one test for the next smallest slice of behavior. Run it. Confirm it fails for the expected reason: an assertion failure or a missing function, not a syntax or import error.

Test passes immediately? You are testing existing behavior. Fix the test.

### Step 2: GREEN

Write the minimum code to pass. Hardcoded return values are acceptable here if they satisfy the test. Run the suite. Confirm green, and confirm the other tests still pass.

Test still fails? Fix the code, not the test.

### Step 3: Next slice

Return to step 1 for the next behavior.

**Refactoring is not part of this loop.** It belongs to the review stage. When the slices are done and green, stop and tell the user. Point them at `/thermo-nuclear-code-quality-review` for a deeper structural pass; that second one is user-invoked only and cannot be called on their behalf. Do not reshape the code yourself mid-cycle.

## 6. Rationalization traps

You will be tempted to break these rules. Reject these thoughts.

| Excuse | Reality |
| :--- | :--- |
| "Too simple to test." | Simple code breaks. The test takes 30 seconds. Write it. |
| "I will write the implementation first to discover the design." | Discover the design through the interface, not the implementation. |
| "I will write all 5 tests first, then implement." | That is horizontal slicing. One vertical slice at a time. |
| "I will write tests right after I finish the code." | Tests written after pass immediately, which proves nothing. They are biased by the code you already wrote. Delete the code and restart. |
| "Already manually tested it." | Manual testing has no record, no re-run, and no proof of coverage. |
| "Deleting X hours of work is wasteful." | Sunk cost. That time is spent either way. Keeping code you cannot trust is the actual waste. |
| "Keep it as reference, then write tests first." | You will adapt it. That is testing after. Delete means delete. |
| "The test harness is too slow to set up right now." | Stop and fix the harness before writing any business logic. |
| "Test is hard to write." | Listen to the test. Hard to test means hard to use. Fix the design. |
| "TDD is dogmatic, I am being pragmatic." | Shortcuts mean debugging in production. That is slower. |

Any of these appearing in your reasoning means: delete the code, start over.

## 7. Before reporting the task complete

- [ ] Every seam under test was confirmed with the user first
- [ ] Every new line of production code is covered by a test observed failing first
- [ ] Each test failed for the expected reason, not a typo or import error
- [ ] Tests run through public interfaces, no private function tests
- [ ] Expected values come from an independent source, not recomputed by the code's own logic
- [ ] Mocks exist only at external I/O boundaries
- [ ] All existing regression tests still pass
- [ ] Output is clean, no stray errors or warnings

Cannot check all the boxes? You skipped TDD. Start over.
