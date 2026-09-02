# Testing

## Running the suite

```bash
npm test              # run once
npm run test:watch    # watch mode, re-runs on file changes
npm run test:coverage # run with a coverage report
```

Tests use [Vitest](https://vitest.dev) with a jsdom environment. No browser or WebMCP flag installation required—they exercise the pure logic layer directly.

## What's tested, and why

Testing is deliberately scoped to `src/lib/` and `src/utils/`—the pure, framework-independent logic layer. This isn't arbitrary: `src/lib/domInspection.ts` and `src/lib/liveRegionTracker.ts` contain the actual detection logic for all three bugs, with zero React or WebMCP involvement. They're the highest-value, most reliably-testable code.

The WebMCP tool registrations in `src/hooks/useAccessibilityTools.ts` are intentionally **not** unit-tested directly. They're thin wiring (schema definitions and narration calls around already-tested logic), and meaningfully testing them would require mocking the WebMCP runtime for little additional confidence. This is a deliberate scoping decision, not an oversight.

## Test files

### `src/lib/domInspection.test.ts`

The most important test file—directly verifies the tab-order detection logic for **Bug 1 (broken focus order)**.

- `buildSelector` — id-based and structural fallback selector generation
- `getAccessibleName` — correct priority order: `aria-label` > `aria-labelledby` > associated `<label>` > placeholder > text content > "not found" marker
- `getAccessibleRole` — explicit `role` precedence and correct implicit-role inference (links/buttons/inputs)
- `getFocusOrder` — the core test group. Verifies positive-`tabIndex` elements sort ahead of natural document order, that natural-order elements retain their relative DOM order after, that the `limit` parameter is respected, and that multiple positive-`tabIndex` elements sort by tabIndex *value*, not DOM position
- `getElementRoleInfo` — graceful handling of missing selectors and correct capture of ARIA state attributes like `aria-invalid`

### `src/lib/liveRegionTracker.test.ts`

Directly verifies detection logic for **Bug 2 (silent ARIA-live region)**.

- Confirms `isLive: false` for regions with no `aria-live` attribute
- Confirms a live region that never mutated correctly reports `firedOnLastChange: false`
- Confirms that once a region's content changes, the `MutationObserver` correctly flips `firedOnLastChange` to `true` (uses `vi.waitFor` since `MutationObserver` callbacks run as microtasks)
- Confirms safe, non-throwing defaults for selectors matching nothing

### `src/utils/id.test.ts`

Sanity checks: correct prefixing and uniqueness across repeated calls.

## A note on the jsdom environment

Two real environment issues were found and fixed while writing tests—both documented fully in [`docs/DEVELOPMENT.md`](DEVELOPMENT.md), summarized here since they directly affect how the visibility-filtering logic in `domInspection.ts` reads:

**`element.offsetParent`** — used to detect whether an element is rendered—requires a real browser layout engine and is always `null` under jsdom. The fix detects whether a layout engine is available and only requires the `offsetParent` signal when one is, so real-browser behavior is unchanged while the function stays testable under jsdom.

## What manual/browser testing still covers

Unit tests validate *detection logic*. They don't replace manually verifying the bugs are real in an actual browser or testing the full WebMCP tool-call flow end-to-end via the Model Context Tool Inspector extension—both are covered in the "How to test it" section of the main `README.md` and were performed manually during development (tabbing through the real form, spot-checking Bug 2 with VoiceOver/NVDA).

## Linting

```bash
npm run lint
```

Uses `oxlint`—zero config, fast, and includes accessibility-related lint rules by default (a natural fit for an accessibility project). The project lints clean with zero warnings and zero errors.

## Type checking

```bash
npx tsc --noEmit
```

Also runs automatically as the first step of `npm run build`. The project type-checks clean.

## Evidence and export smoke test

Use this workflow after changing tool or store code:

1. Start the app with `npm run dev` and open the local URL in a browser with WebMCP enabled.
2. Invoke an inspection tool through the Tool Inspector.
3. Invoke `report_violation` with a finding that matches the observation. Expand **View supporting evidence** on the pending card.
4. Check that the card names the inspection tool, selector, summary, and bounded details.
5. Confirm the finding, select **Export audit brief**, and check the downloaded JSON for `product`, `generatedAt`, `confirmedCount`, and `findings[].evidence`.
6. Repeat with Dismiss and confirm that a dismissed finding is absent from the exported log.

The export is a client-side artifact. It does not upload findings, include DOM nodes, or claim
that a screen reader spoke a message; it records what browser inspection observed.
