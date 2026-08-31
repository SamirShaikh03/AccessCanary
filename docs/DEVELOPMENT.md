# Development Process

This document is an honest account of how AccessCanary was built — including the real
engineering decisions, the wrong turns, and why each course-correction happened. It's
here for anyone curious about the process, and as a record of judgment calls a reviewer
might otherwise wonder about.

## Phase 1 — Foundation and design system

The project started from a competitive-research pass across the WebMCP Challenge
landscape: which patterns were already shown by the challenge sponsor's own examples
(shopping carts, booking flows, collaborative documents, crossword generation), and where
genuine white space remained. Accessibility auditing — specifically, the gap between what
automated scanners can see (static HTML) and what only shows up through live interaction
(focus order, ARIA-live timing, keyboard traps) — was identified as unclaimed territory,
backed by independent published research putting scanner coverage at roughly 30–40%.

The visual design was built deliberately against the two most common AI-generated
defaults (warm cream/terracotta palettes, and near-black/acid-accent palettes). Instead,
a "signal light" color system was chosen — green/amber/red carrying real state meaning
(safe/checking/broken) — because the product's actual subject is *state*, not brand
decoration. The layout concept (a split "theatre" with the form on one side and an
observer panel on the other) mirrors the literal human+agent mechanic being demonstrated.

## Phase 2 — WebMCP tool layer, and a real dependency correction

The six tools were designed around a deliberately tight scope: read-only inspection tools
(`get_focus_order`, `simulate_tab_sequence`, `get_aria_live_state`, `get_element_role`,
`get_violation_log`) plus exactly one state-changing tool (`report_violation`), gated
behind human confirmation.

**A genuine mid-build correction happened here.** The initial implementation used Zod
object maps for `inputSchema`/`outputSchema`, following the pattern shown in several
third-party WebMCP tutorials. When the project was type-checked and built, this produced
real TypeScript errors — not stylistic warnings, but structural type mismatches. Tracing
the cause: `@mcp-b/react-webmcp` has no declared Zod dependency at all (checked directly
in its `package.json`), and its Zod-map support is structurally typed against a specific
Zod v3 internal shape. `npm install zod` installs the current release (v4), whose
internals don't match. Rather than pin an old Zod version and accept future fragility,
the schemas were rewritten as plain JSON Schema — the format the package's own official
GitHub examples show first, with zero version-coupling risk. This is documented inline in
`useAccessibilityTools.ts` as well, not just here.

A second, smaller correction followed from the same switch: TypeScript's JSON-Schema
type inference requires output values to carry an implicit index signature, which the
project's named domain interfaces (`FocusStep`, `Violation`, etc.) don't have. Two
possible fixes existed: add index signatures to the domain types themselves (rejected —
it would leak a WebMCP-specific concern into the core domain model, weakening type safety
everywhere else those types are used), or add small reshaping functions exactly at the
tool boundary (`plainFocusStep`, `plainViolation`, etc. in `useAccessibilityTools.ts`)
that construct fresh object literals TypeScript can correctly infer against. The second
approach was used — it keeps the fix localized to where it's actually needed.

## Phase 3 — Narration panel and the focus-trace overlay

The narration store was built to mirror the violations store's pattern (Context +
reducer) for consistency, then wired directly into each tool's `execute` function so
every tool call narrates itself in plain language as it happens — not just on success,
but with tool-specific interpretation (`simulate_tab_sequence`, for instance, detects and
flags trap-like behavior itself, by checking whether focus only cycled between a
suspiciously small number of unique elements across many simulated tab presses).

One deliberate design risk was taken here: the focus-trace overlay (a glowing dot that
visibly tracks keyboard focus in real time). This was chosen as the project's one bold
visual signature — making an otherwise invisible accessibility mechanic viscerally
visible — rather than defaulting to a purely textual narration feed. It's implemented on
the browser's native `focusin` event with no external animation library, kept simple
enough to stay reliable for a live demo.

A small code-quality fix also happened in this phase: `oxlint` correctly flagged that
`violationsStore.tsx` mixed a component export with hook/context exports in one file,
which breaks React Fast Refresh. This was split into three files
(`violationsContext.ts`, `ViolationsProvider.tsx`, `useViolationsStore.ts`) — the same
pattern was applied to the narration store from the start, once the issue was
understood.

## Phase 4 — Testing and documentation

Unit tests were written for the pure logic layer (`lib/domInspection.ts`,
`lib/liveRegionTracker.ts`, `utils/id.ts`) — deliberately not for the WebMCP tool
registrations themselves, since those are thin wiring around already-tested logic, and
testing them meaningfully would require mocking the WebMCP runtime for little additional
confidence.

**A real environment bug surfaced here, too.** The initial visibility-filtering logic in
`getFocusOrder` relied on `element.offsetParent !== null` to skip hidden elements —
correct in real browsers, but `offsetParent` is always `null` under jsdom (the test
environment), since jsdom does not run a layout engine. This silently filtered every
element out of every test fixture, producing confusing empty-array failures that looked
like logic bugs. The fix: detect whether a real layout engine is available (checking the
`navigator.userAgent` for jsdom's signature) and only require the `offsetParent` signal
when one is — keeping the real-browser behavior exactly as strict as before, while making
the function correctly testable under jsdom.

A second test-authoring mistake was caught and fixed in the same pass: an early version
of the "positive tabIndex reorders the page" test asserted on `getFocusOrder('#name',
10)`, but `getFocusOrder`'s slicing semantics start *at* the requested element's position
within the already-reordered sequence — so an element that comes globally first (like the
`tabIndex`-boosted submit button) can never appear in a slice that starts after it. The
fix wasn't to change the (correct) production logic, but to query from a non-focusable
container element instead, which reliably returns the full page order from the top —
matching how an agent would realistically inspect "the whole form" in practice.

## Guiding principle throughout

Where a fix was needed, the question asked was always: *is this a bug in the logic being
tested, or a mismatch between the test environment and reality?* Production logic was
only changed when it was actually wrong. Where the mismatch was in the test's
environment or assumptions instead (jsdom's lack of layout, a flawed test fixture), the
test was fixed and the reason documented — rather than weakening real application logic
just to make a red test turn green.
