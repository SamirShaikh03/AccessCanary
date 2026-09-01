# AccessCanary

**An AI agent that catches accessibility bugs static scanners can't see.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![WebMCP Challenge 2026](https://img.shields.io/badge/WebMCP-Challenge%202026-blue)](https://www.anthropic.com/news/webmcp-challenges)

---

An AI+human pair investigating live form state that static scanners can't see. Built on [WebMCP](https://github.com/webmachinelearning/webmcp), AccessCanary exposes six tools that let an agent observe real keyboard focus order, whether ARIA-live regions actually announce changes, and whether a component traps focus—rather than guessing from static HTML. A human tabs through a mock benefits form; the agent narrates in real time; only human-confirmed findings get logged.

![<!-- PLACEHOLDER: Replace this with a real screenshot of the form + narration panel side-by-side; this is a placeholder svg used during development -->placeholder: hero screenshot of the split-stage layout, showing the form on the left and the live narration panel on the right](docs/images/hero.png)

## Why this exists

You've probably shipped a form that passed an automated accessibility scan and still failed a real user. It's not a failure of the scanner—it's a fundamental limit of scanning without execution.

Automated tools (axe-core, Lighthouse, WAVE) are excellent at catching static issues: missing alt text, insufficient contrast, missing form labels. But independent research puts their real-world coverage at roughly **30–40% of WCAG issues**. The rest only exist as *behavior*: broken tab order when a field is focused, silent ARIA-live regions when validation fires, keyboard focus trapped inside a date picker. These bugs are invisible to HTML crawlers. They're only visible to something that actually operates the page.

WebMCP tools can do that. This project demonstrates how.

## What it does

AccessCanary presents a mock government-benefits form containing **three real, intentional accessibility defects**—the kind that actually occur in production code. As a human tabs through the form, an AI agent calls WebMCP tools to inspect live DOM state, narrates what it observes in a side panel, and proposes findings. **Nothing gets logged until the human approves it.** The agent can flag, but only a person decides what counts as a real violation.

### The six WebMCP tools

| Tool | Purpose | Read-only |
|---|---|---|
| `get_focus_order` | Returns the real browser tab order from a starting element, correctly honoring positive `tabIndex` rules | ✓ Yes |
| `simulate_tab_sequence` | Simulates N Tab presses with real keydown events, so focus-trap logic gets a genuine chance to run | ✓ Yes |
| `get_aria_live_state` | Reports whether a region has `aria-live`, its politeness level, and whether it actually fired on last change | ✓ Yes |
| `get_element_role` | Returns accessible role, name, and relevant ARIA state of an element | ✓ Yes |
| `report_violation` | Proposes a finding for human review; does **not** log anything directly | ✗ No |
| `get_violation_log` | Returns confirmed violation count and details | ✓ Yes |

Full technical specs (schemas, character budgets, security annotations) are in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

### The three bugs it catches

1. **Broken focus order** — A `tabIndex` override pulls the submit button to the very front of the tab sequence, ahead of every field a user would expect to fill first (WCAG 2.4.3).
2. **Silent ARIA-live region** — A validation error appears visually but was never wired to an `aria-live` region, so screen reader users get no announcement (WCAG 4.1.3).
3. **Keyboard trap** — A custom date picker's focus-cycling logic never releases focus back to the page (WCAG 2.1.2).

## Quick start

Clone this repo and run it locally:

```bash
git clone https://github.com/[user]/civic-accessibility-copilot.git
cd civic-accessibility-copilot
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser. The form and narration panel are ready to explore immediately; no backend, no setup required.

To run the test suite:

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

## Testing the live demo

To test the deployed version with a live AI agent:

1. Open the live URL in Chrome.
2. Enable `chrome://flags/#enable-webmcp-testing`, then relaunch Chrome.
3. Install the [Model Context Tool Inspector](https://chrome.google.com/webstore) extension.
4. Tab through the mock form — watch the **focus-trace dot** follow your keyboard focus and the **narration panel** report what each tool call finds.
5. Trigger the income field's validation error and tab through the date picker more than twice to see each bug in action.
6. Open the Tool Inspector to invoke tools directly and inspect raw input/output.

See [`docs/TESTING.md`](docs/TESTING.md) for the full testing guide, including manual and automated test options.

## Tech stack

**Frontend:** React 19 + TypeScript + Vite  
**State:** React Context + `useReducer` (two small stores, no external library)  
**WebMCP:** [`@mcp-b/react-webmcp`](https://www.npmjs.com/package/@mcp-b/react-webmcp) with `document.modelContext`  
**Schemas:** Plain JSON Schema (not Zod — see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for why)  
**Testing:** Vitest + jsdom  
**Linting:** oxlint (zero config, includes a11y rules by default)  
**Deployment:** Render (static site)

## What this project is not

- **Not a real submission system.** This form doesn't connect to any insurance, government, or benefits database. "Submit" is intentionally a no-op.
- **Not a replacement for accessibility audits or automated scanners.** It's a demonstration of a *category* of bug those scanners structurally cannot see.
- **Not claiming complete coverage.** The 30–40% scanner-coverage figure is from independent published research. AccessCanary doesn't claim a specific coverage percentage of its own.

## Documentation

- [**Architecture**](docs/ARCHITECTURE.md) — System design, layer structure, data flow through a tool call, the human-in-the-loop confirmation cycle, and design decisions explained.
- [**Development**](docs/DEVELOPMENT.md) — The real build history: four phases, genuine course-corrections (a Zod v3/v4 mismatch, a jsdom `offsetParent` issue), and why each fix was made.
- [**Testing**](docs/TESTING.md) — How to run tests, what's tested and why, test environment notes, and manual verification steps.
- [**CHANGELOG**](CHANGELOG.md) — Version history and what changed in each phase.
- [**Security**](SECURITY.md) — Security surface, tool annotations, and how to report concerns.

## License

MIT — see [LICENSE](LICENSE).
