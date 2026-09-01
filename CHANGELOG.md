# Changelog

All notable changes to this project are documented here. This project adheres to [Keep a Changelog](https://keepachangelog.com).

## [Unreleased]

## [0.4.0] — 2026-09-03

### Added
- Unit test suite covering pure logic layer (`src/lib/` and `src/utils/`)
- Test cases for all three bug-detection mechanisms (focus order, ARIA-live regions, keyboard traps)
- Coverage reporting via `npm run test:coverage`
- Type checking as first step of build pipeline
- Complete documentation suite: Architecture, Development, Testing guides
- Character-budget compliance notes in WebMCP tool definitions

### Fixed
- jsdom `offsetParent` issue: visibility filtering now detects layout engine availability before requiring `offsetParent !== null`
- Test fixture assumption: `getFocusOrder` tab-sequence test now queries from container element to reliably return full page order

## [0.3.0] — 2026-09-02

### Added
- Narration store (React Context + reducer) for tool-call narration feed
- `NarrationPanel` UI component displaying real-time tool activity
- Focus-trace overlay: glowing dot that visibly tracks keyboard focus
- `PendingViolationCard` component for human-in-the-loop confirmation workflow
- `simulate_tab_sequence` WebMCP tool with trap-detection logic

### Changed
- Split `violationsStore.tsx` into three files (`violationsContext.ts`, `ViolationsProvider.tsx`, `useViolationsStore.ts`) to respect React Fast Refresh boundaries
- Applied same file-split pattern to narration store from inception

## [0.2.0] — 2026-09-01

### Added
- Six WebMCP tools: `get_focus_order`, `simulate_tab_sequence`, `get_aria_live_state`, `get_element_role`, `report_violation`, `get_violation_log`
- Pure logic layer for DOM inspection: `lib/domInspection.ts` and `lib/liveRegionTracker.ts`
- JSON-Schema-based tool schemas with character-budget compliance
- Security annotations: read-only tools marked with `readOnlyHint: true`, state-changing tool with `readOnlyHint: false`
- Violations store (React Context + reducer)
- `useAccessibilityTools` hook wiring pure logic to WebMCP tool definitions

### Fixed
- Resolved Zod v3/v4 version mismatch: switched from Zod object maps to plain JSON Schema for tool schemas
- Added reshaping functions (`plainFocusStep`, `plainViolation`, etc.) at tool boundary to match TypeScript's JSON-Schema type inference requirements

## [0.1.0] — 2026-08-31

### Added
- Single-page React application with zero backend
- Mock government-benefits form with three real accessibility bugs: broken focus order, silent ARIA-live region, keyboard trap
- "Signal light" color system (green/amber/red) reflecting bug state
- Split-theatre layout: form on left, observer panel on right
- `BenefitsForm` component containing Bug 1 (tabIndex override) and Bug 2 (silent error message)
- `DatePickerTrap` component containing Bug 3 (keyboard focus trap)
- `App` component orchestrating layout and form state
- React 19 + TypeScript + Vite development stack
- Vitest configuration for unit testing

[Unreleased]: https://github.com/[user]/civic-accessibility-copilot/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/[user]/civic-accessibility-copilot/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/[user]/civic-accessibility-copilot/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/[user]/civic-accessibility-copilot/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/[user]/civic-accessibility-copilot/releases/tag/v0.1.0
