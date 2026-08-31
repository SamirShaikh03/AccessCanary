# Testing

## Running the suite

```bash
npm test              # run once
npm run test:watch    # watch mode, re-runs on file changes
npm run test:coverage # run with a coverage report
```

Tests use [Vitest](https://vitest.dev) with a jsdom environment. No browser installation
or WebMCP flag is required to run them — they exercise the pure logic layer directly.

## What's tested, and why

Testing is deliberately scoped to `src/lib/` and `src/utils/` — the pure,
framework-independent logic layer. This is not an arbitrary line: `src/lib/domInspection.ts`
and `src/lib/liveRegionTracker.ts` contain the actual detection logic for all three of
this project's bugs, with zero React or WebMCP involvement. They're the highest-value,
most reliably-testable code in the project.

The WebMCP tool registrations in `src/hooks/useAccessibilityTools.ts` are intentionally
**not** unit-tested directly. They are thin wiring — schema definitions and narration
calls around logic that's already covered by the tests below — and meaningfully testing
the registration layer itself would require mocking the WebMCP runtime for little
additional confidence. This is a scoping decision, not an oversight.

## Test files

### `src/lib/domInspection.test.ts`

The most important test file in the project — it directly verifies the tab-order logic
that detects **Bug 1 (broken focus order)**.

- `buildSelector` — id-based and structural fallback selector generation
- `getAccessibleName` — the priority order a real accessible-name computation should
  follow (`aria-label` > `aria-labelledby` > associated `<label>` > placeholder > text
  content > a clear "not found" marker)
- `getAccessibleRole` — explicit `role` attribute precedence, and correct implicit-role
  inference for links/buttons/inputs
- `getFocusOrder` — the core test group. Verifies that an element with a positive
  `tabIndex` is correctly sorted ahead of the page's natural document order (the exact
  mechanism of Bug 1), that natural-order elements retain their relative DOM order after
  it, that the `limit` parameter is respected, and that multiple positive-`tabIndex`
  elements sort by their tabIndex *value*, not their DOM position
- `getElementRoleInfo` — graceful handling of a missing selector, and correct capture of
  ARIA state attributes like `aria-invalid`

### `src/lib/liveRegionTracker.test.ts`

Directly verifies the detection logic for **Bug 2 (silent ARIA-live region)**.

- Confirms `isLive: false` is reported for a region with no `aria-live` attribute
- Confirms a live region that has never mutated correctly reports
  `firedOnLastChange: false`
- Confirms that once a live region's content actually changes, the `MutationObserver`
  correctly flips `firedOnLastChange` to `true` (this test uses `vi.waitFor` since
  `MutationObserver` callbacks run as a microtask, not synchronously)
- Confirms a safe, non-throwing default is returned for a selector that matches nothing

### `src/utils/id.test.ts`

Small sanity checks on the ID-generation utility: correct prefixing, and uniqueness
across repeated calls.

## A note on the jsdom environment

Two real environment issues were found and fixed while writing these tests — both are
documented in full in `docs/DEVELOPMENT.md`, but summarized here since they directly
affect how the visibility-filtering logic in `domInspection.ts` reads:

`element.offsetParent` — used to detect whether an element is actually visible/rendered —
requires a real browser layout engine and is always `null` under jsdom. The fix detects
whether a layout engine is available and only requires the `offsetParent` signal when one
is, so the real-browser behavior is unchanged while the function stays testable under
jsdom.

## What manual/browser testing still covers

Unit tests validate the *detection logic*. They do not replace manually verifying the
bugs are real in an actual browser, or testing the full WebMCP tool-call flow end to end
via the Model Context Tool Inspector extension — both of those are covered in the
step-by-step verification instructions in the main `README.md`'s "How to test it"
section, and were performed manually during Phase 1–2 of development (tabbing through the
real form, and spot-checking Bug 2 with VoiceOver/NVDA).

## Linting

```bash
npm run lint
```

Uses `oxlint` — zero-config, fast, and includes accessibility-related lint rules by
default, which is a fitting extra safety net for a project about accessibility. The
project currently lints clean with zero warnings and zero errors.

## Type checking

```bash
npx tsc --noEmit
```

Also run automatically as the first step of `npm run build`. The project type-checks
clean.
