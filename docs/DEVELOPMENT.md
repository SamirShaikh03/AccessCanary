# Development Process

**Read this if:** you want to understand how AccessCanary actually got built, why specific technical decisions were made, or how real problems (a dependency mismatch, a test environment issue) were diagnosed and fixed.

## TL;DR — Two real course-corrections happened

1. **Phase 2 — Zod v3/v4 mismatch:** Initial tool schemas used Zod object maps (following tutorials), but `@mcp-b/react-webmcp` doesn't declare a Zod peer dependency and only supports v3 internals. Installing current Zod (v4) broke the build. Fix: switched to plain JSON Schema, zero version risk, and the package's own official format.

2. **Phase 4 — jsdom `offsetParent` limitation:** The visibility filter in `getFocusOrder` used `element.offsetParent !== null` (correct in browsers), but jsdom always returns `null` since it has no layout engine. Fix: detect jsdom in `navigator.userAgent` and only require the `offsetParent` check when a real layout engine is available.

Both issues reveal the principle: *fix the root cause, don't paper over it.* Otherwise, follow below for the full story.

---

## Phase 1 — Foundation and design system

The project started from a competitive research pass across the WebMCP Challenge landscape to find white space. Accessibility auditing—specifically, the gap between what automated scanners see (static HTML) and what only exists through live interaction (focus order, ARIA-live timing, keyboard traps)—emerged as genuinely unclaimed territory, backed by independent research putting scanner coverage at roughly 30–40%.

Visual design was built deliberately *against* the two most common AI-generated defaults: warm cream/terracotta and near-black/acid-accent palettes. Instead, a "signal light" color system was chosen—green/amber/red carrying real state meaning (safe/checking/broken)—because the product's actual subject is *state*, not brand decoration. The layout mirrors the literal mechanic being demonstrated: a split "theatre" with the form on one side and an observer panel on the other.

## Phase 2 — WebMCP tool layer, and a real dependency correction

The six tools were designed around a deliberately tight scope: five read-only inspection tools (`get_focus_order`, `simulate_tab_sequence`, `get_aria_live_state`, `get_element_role`, `get_violation_log`) plus exactly one state-changing tool (`report_violation`), gated behind human confirmation.

**A genuine mid-build correction happened here.** Initial implementation used Zod object maps for schemas, following a pattern shown in several third-party tutorials. When the project type-checked and built, real TypeScript errors surfaced—structural type mismatches, not stylistic warnings. Root cause: `@mcp-b/react-webmcp` has no declared Zod peer dependency and is structurally typed against Zod v3 internals. Installing current Zod (v4) produces structural mismatches. Rather than pin an old version and accept fragility, schemas were rewritten as plain JSON Schema—zero version-coupling risk, and the format the package's own official examples show first. This is documented inline in `useAccessibilityTools.ts` as well.

A second, smaller correction followed: TypeScript's JSON-Schema type inference requires output values to carry an implicit index signature, which the project's named domain interfaces (`FocusStep`, `Violation`, etc.) don't have. Two fixes existed: (1) add index signatures to domain types (rejected—it would leak WebMCP concerns into the core domain model, weakening type safety elsewhere), or (2) add small reshaping functions at the tool boundary (`plainFocusStep`, `plainViolation`, etc.) constructing fresh object literals TypeScript can correctly infer. Option 2 was chosen, keeping the fix localized to where it's actually needed.

## Phase 3 — Narration panel and the focus-trace overlay

The narration store was built to mirror the violations store's pattern (Context + reducer) for consistency, then wired directly into each tool's `execute` function so every tool call narrates itself in plain language as it happens—not just on success, but with tool-specific interpretation. For example, `simulate_tab_sequence` detects and flags trap-like behavior itself by checking whether focus only cycled between a suspiciously small number of unique elements across many simulated tab presses.

One deliberate design risk was taken: the focus-trace overlay (a glowing dot visibly tracking keyboard focus in real time). This was chosen as the project's one bold visual signature—making an otherwise invisible accessibility mechanic viscerally visible—rather than defaulting to a purely textual narration feed. It's implemented on the browser's native `focusin` event with no external animation library, kept simple enough to stay reliable for a live demo.

A small code-quality fix also happened here: `oxlint` correctly flagged that `violationsStore.tsx` mixed a component export with hook/context exports, which breaks React Fast Refresh. This was split into three files (`violationsContext.ts`, `ViolationsProvider.tsx`, `useViolationsStore.ts`)—the same pattern was applied to the narration store from the start, once the issue was understood.

## Phase 4 — Testing and documentation

Unit tests were written for the pure logic layer (`lib/domInspection.ts`, `lib/liveRegionTracker.ts`, `utils/id.ts`)—deliberately not for the WebMCP tool registrations, since those are thin wiring around already-tested logic, and testing them meaningfully would require mocking the WebMCP runtime for little gain.

**A real environment bug surfaced here.** The initial visibility-filtering logic in `getFocusOrder` relied on `element.offsetParent !== null` to skip hidden elements—correct in real browsers, but `offsetParent` is always `null` under jsdom (the test environment), since jsdom has no layout engine. This silently filtered every element out of every test fixture, producing confusing empty-array failures that looked like logic bugs. Fix: detect whether a real layout engine is available (checking `navigator.userAgent` for jsdom's signature) and only require the `offsetParent` signal when one is—keeping real-browser behavior exactly as strict as before while making the function correctly testable under jsdom.

A second test-authoring mistake was caught and fixed: an early version of the "positive tabIndex reorders the page" test asserted on `getFocusOrder('#name', 10)`, but `getFocusOrder`'s slicing semantics start *at* the requested element's position within the already-reordered sequence. An element that comes globally first (like the `tabIndex`-boosted submit button) can never appear in a slice that starts after it. Fix: query from a non-focusable container instead, which reliably returns the full page order from the top—matching how an agent would realistically inspect "the whole form" in practice. Production logic was unchanged; only the test assumption was corrected.

## Guiding principle throughout

Where a fix was needed, the question asked was always: *is this a bug in the logic being tested, or a mismatch between the test environment and reality?* Production logic was only changed when actually wrong. Where the mismatch was in the test's environment or assumptions instead (jsdom's lack of layout, a flawed test fixture), the test was fixed and the reason documented—rather than weakening real application logic just to make a test turn green.

## Phase 5 — Evidence-backed audit handoff

The original narration feed made the demo understandable in the moment, but it was transient:
once a finding was confirmed, a developer had no compact artifact showing what the agent had
actually observed. Phase 5 adds `AuditEvidence` as a small domain type and retains only the
latest bounded inspection result while the WebMCP session is active.

Evidence is attached at the existing `report_violation` boundary, travels through the existing
human confirmation reducer, and is rendered by the pending card. Confirmed findings can be
serialized client-side as a JSON audit brief. No backend, authentication, DOM serialization, or
new dependency is needed.

The model is intentionally honest: it records browser-observed state, not a full session replay
and not guaranteed screen-reader speech. A concise reproducible observation is more useful than
an overconfident claim in a real audit workflow.
