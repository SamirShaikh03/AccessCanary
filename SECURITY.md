# Security

## Security Surface

AccessCanary is a **hackathon demo with zero backend, no user data persistence beyond a browser session, and no authentication.** The security surface is small:

- **No backend.** All logic runs in the browser. No server to compromise or database to breach.
- **No data persistence.** Form data and violation logs live only in session memory. Refreshing the page clears everything.
- **No external dependencies on DOM manipulation.** The core logic (`lib/domInspection.ts`, `lib/liveRegionTracker.ts`) uses only standard DOM APIs. No jQuery, JSDOM, or third-party DOM libraries.
- **No real form submission.** The mock form's Submit button is intentionally a no-op—it doesn't call any backend, submit to any real system, or persist anything.

## WebMCP Tool Security

AccessCanary follows the published WebMCP security guidance:

- **Read-only tools correctly annotated:** Five of six tools (`get_focus_order`, `simulate_tab_sequence`, `get_aria_live_state`, `get_element_role`, `get_violation_log`) are marked with `readOnlyHint: true`.
- **State-changing tool gated behind human confirmation:** The one state-changing tool (`report_violation`) is marked `readOnlyHint: false` and requires explicit human approval (via a UI button) before any data is actually logged. The agent cannot unilaterally commit violations.
- **Character budgets respected:** Tool names, descriptions, parameter descriptions, and output payloads all comply with WebMCP's published limits (names <30 chars, descriptions <500 chars, parameter descriptions <150 chars, outputs well under ~1.5K char cap).

See [`src/hooks/useAccessibilityTools.ts`](src/hooks/useAccessibilityTools.ts) for the complete tool definitions with inline annotations.

## Reporting a Security Concern

Since this is a solo hackathon project, use [GitHub Issues](https://github.com/[user]/civic-accessibility-copilot/issues) to report any security concerns. Describe the issue clearly; given the project's scope (browser-only, no backend, no data persistence), most concerns will be scoping clarifications rather than actionable exploits.

Do not invent security vulnerabilities not present in a browser-only, session-scoped demo. This is a WebMCP Challenge submission, not production infrastructure.
