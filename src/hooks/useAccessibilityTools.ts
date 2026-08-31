import { useEffect, useRef } from 'react';
import { useWebMCP } from '@mcp-b/react-webmcp';
import {
  getFocusOrder,
  simulateTabSequence,
  getElementRoleInfo,
} from '../lib/domInspection';
import { getAriaLiveState } from '../lib/liveRegionTracker';
import { useViolationsStore } from '../store/useViolationsStore';
import { useNarrationStore } from '../store/useNarrationStore';
import type { FocusStep, AriaLiveState, ElementRoleInfo, Violation } from '../types/accessibility';

/**
 * Reshape helpers: WebMCP's JSON-Schema-derived output types require a
 * fresh object literal at the return boundary (TypeScript only infers the
 * implicit index signature these types need for literals created inline,
 * not for values typed via a named domain interface). These small mappers
 * keep that reshaping localized to the tool boundary, out of the domain
 * model in src/types.
 */
const plainFocusStep = (s: FocusStep) => ({
  selector: s.selector,
  role: s.role,
  accessibleLabel: s.accessibleLabel,
  order: s.order,
});

const plainAriaLiveState = (s: AriaLiveState) => ({
  selector: s.selector,
  isLive: s.isLive,
  politeness: s.politeness,
  firedOnLastChange: s.firedOnLastChange,
});

const plainElementRoleInfo = (s: ElementRoleInfo) => ({
  selector: s.selector,
  role: s.role,
  accessibleName: s.accessibleName,
  states: { ...s.states },
});

const plainViolation = (v: Violation) => ({
  id: v.id,
  category: v.category,
  severity: v.severity,
  description: v.description,
  selector: v.selector,
  timestamp: v.timestamp,
});

/**
 * Registers the six WebMCP tools this project exposes.
 *
 * Schemas use plain JSON Schema rather than a Zod object map. The package
 * does support Zod maps in principle, but only against a specific internal
 * Zod v3 shape that isn't declared as a peer dependency — installing the
 * current Zod release (v4) produces real type mismatches, since v4's
 * internals differ structurally from what the package expects. Plain JSON
 * Schema has no such version coupling and is the more dependency-stable
 * choice for a project that needs to keep building through submission day.
 *
 * Schemas are defined as module-level constants rather than inline
 * literals — inline objects are recreated on every render, which can cause
 * a tool to be torn down and re-registered constantly instead of staying
 * stable.
 *
 * Character budgets (per WebMCP's published security guidance) are
 * respected throughout: tool/parameter names under 30 chars, tool
 * descriptions under 500, parameter descriptions under 150, and every
 * tool's return payload kept well under the ~1.5K character output cap.
 */

const focusStepSchema = {
  type: 'object',
  properties: {
    selector: { type: 'string' },
    role: { type: 'string' },
    accessibleLabel: { type: 'string' },
    order: { type: 'number' },
  },
  required: ['selector', 'role', 'accessibleLabel', 'order'],
} as const;

// ---- Tool 1: get_focus_order ----------------------------------------------

const getFocusOrderInput = {
  type: 'object',
  properties: {
    startSelector: {
      type: 'string',
      description: 'CSS selector of the element to start the tab sequence from',
    },
    limit: { type: 'number', description: 'Max number of steps to return, default 20' },
  },
  required: ['startSelector'],
} as const;

const getFocusOrderOutput = {
  type: 'object',
  properties: { steps: { type: 'array', items: focusStepSchema } },
  required: ['steps'],
} as const;

// ---- Tool 2: simulate_tab_sequence -----------------------------------------

const simulateTabInput = {
  type: 'object',
  properties: {
    startSelector: { type: 'string', description: 'CSS selector of the element to start tabbing from' },
    steps: { type: 'number', description: 'Number of Tab presses to simulate, max 10' },
  },
  required: ['startSelector', 'steps'],
} as const;

const simulateTabOutput = {
  type: 'object',
  properties: { path: { type: 'array', items: focusStepSchema } },
  required: ['path'],
} as const;

// ---- Tool 3: get_aria_live_state -------------------------------------------

const ariaLiveInput = {
  type: 'object',
  properties: {
    selector: { type: 'string', description: 'CSS selector of the live region to inspect' },
  },
  required: ['selector'],
} as const;

const ariaLiveOutput = {
  type: 'object',
  properties: {
    selector: { type: 'string' },
    isLive: { type: 'boolean' },
    politeness: { type: 'string' },
    firedOnLastChange: { type: 'boolean' },
  },
  required: ['selector', 'isLive', 'politeness', 'firedOnLastChange'],
} as const;

// ---- Tool 4: get_element_role ----------------------------------------------

const elementRoleInput = {
  type: 'object',
  properties: {
    selector: { type: 'string', description: 'CSS selector of the element to inspect' },
  },
  required: ['selector'],
} as const;

const elementRoleOutput = {
  type: 'object',
  properties: {
    selector: { type: 'string' },
    role: { type: 'string' },
    accessibleName: { type: 'string' },
    states: { type: 'object' },
  },
  required: ['selector', 'role', 'accessibleName', 'states'],
} as const;

// ---- Tool 5: report_violation -----------------------------------------------

const reportViolationInput = {
  type: 'object',
  properties: {
    category: { type: 'string', enum: ['focus-order', 'silent-live-region', 'keyboard-trap'] },
    severity: { type: 'string', enum: ['critical', 'serious', 'moderate'] },
    description: { type: 'string', description: 'Plain-language description of what was observed' },
    selector: { type: 'string', description: 'Where in the page the issue was found' },
  },
  required: ['category', 'severity', 'description', 'selector'],
} as const;

const reportViolationOutput = {
  type: 'object',
  properties: { pendingId: { type: 'string' }, status: { type: 'string' } },
  required: ['pendingId', 'status'],
} as const;

// ---- Tool 6: get_violation_log -----------------------------------------------

const violationLogOutput = {
  type: 'object',
  properties: {
    totalCount: { type: 'number' },
    recent: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          category: { type: 'string' },
          severity: { type: 'string' },
          description: { type: 'string' },
          selector: { type: 'string' },
          timestamp: { type: 'string' },
        },
        required: ['id', 'category', 'severity', 'description', 'selector', 'timestamp'],
      },
    },
  },
  required: ['totalCount', 'recent'],
} as const;

type ReportViolationInput = {
  category: 'focus-order' | 'silent-live-region' | 'keyboard-trap';
  severity: 'critical' | 'serious' | 'moderate';
  description: string;
  selector: string;
};

export function useAccessibilityTools() {
  const { violations, proposeViolation } = useViolationsStore();
  const { addEntry, updateEntry } = useNarrationStore();

  // Tool 6 needs the latest violations list inside a stable `execute`
  // closure without forcing re-registration on every state change — a ref
  // kept in sync via effect gives fresh reads without that churn.
  const violationsRef = useRef(violations);
  useEffect(() => {
    violationsRef.current = violations;
  }, [violations]);

  useWebMCP({
    name: 'get_focus_order',
    description:
      'Returns the real browser tab order starting from a given element, honoring positive tabIndex ' +
      'ordering rules. Use this to check whether the visual/DOM order matches the actual keyboard tab order.',
    inputSchema: getFocusOrderInput,
    outputSchema: getFocusOrderOutput,
    annotations: { title: 'Get Focus Order', readOnlyHint: true, idempotentHint: true, destructiveHint: false },
    execute: async (input: { startSelector: string; limit?: number }) => {
      const entryId = addEntry('get_focus_order', `Checking tab order from ${input.startSelector}...`);
      const steps = getFocusOrder(input.startSelector, input.limit ?? 20).map(plainFocusStep);
      updateEntry(entryId, { message: `Traced ${steps.length} steps in the tab order.`, status: 'complete' });
      return { steps };
    },
  });

  useWebMCP({
    name: 'simulate_tab_sequence',
    description:
      'Simulates pressing Tab a number of times starting from an element, dispatching real keydown events ' +
      'so custom focus-trap handlers get a genuine chance to run. Returns the resulting focus path.',
    inputSchema: simulateTabInput,
    outputSchema: simulateTabOutput,
    annotations: {
      title: 'Simulate Tab Sequence',
      readOnlyHint: true,
      idempotentHint: false,
      destructiveHint: false,
    },
    execute: async (input: { startSelector: string; steps: number }) => {
      const entryId = addEntry(
        'simulate_tab_sequence',
        `Simulating ${input.steps} Tab presses from ${input.startSelector}...`,
      );
      const path = simulateTabSequence(input.startSelector, Math.min(input.steps, 10)).map(plainFocusStep);
      const uniqueStops = new Set(path.map((p) => p.selector)).size;
      const looksTrapped = uniqueStops <= 2 && path.length > 3;
      updateEntry(entryId, {
        message: looksTrapped
          ? `Focus only cycled between ${uniqueStops} elements across ${path.length} presses — looks like a trap.`
          : `Focus moved through ${uniqueStops} distinct elements as expected.`,
        status: looksTrapped ? 'flagged' : 'complete',
      });
      return { path };
    },
  });

  useWebMCP({
    name: 'get_aria_live_state',
    description:
      'Reports whether an element has aria-live set, its politeness level, and whether it actually fired ' +
      'an announcement the last time its content changed — catching silent live regions.',
    inputSchema: ariaLiveInput,
    outputSchema: ariaLiveOutput,
    annotations: {
      title: 'Get ARIA-Live State',
      readOnlyHint: true,
      idempotentHint: true,
      destructiveHint: false,
    },
    execute: async (input: { selector: string }) => {
      const entryId = addEntry('get_aria_live_state', `Checking whether ${input.selector} announces changes...`);
      const result = plainAriaLiveState(getAriaLiveState(input.selector));
      const silent = !result.isLive || !result.firedOnLastChange;
      updateEntry(entryId, {
        message: silent
          ? `${input.selector} changed but was never announced to screen readers.`
          : `${input.selector} correctly announced its last change (${result.politeness}).`,
        status: silent ? 'flagged' : 'complete',
      });
      return result;
    },
  });

  useWebMCP({
    name: 'get_element_role',
    description:
      'Returns the accessible role, accessible name, and relevant ARIA state of an element, so an agent ' +
      'can confirm it is announced correctly to assistive technology.',
    inputSchema: elementRoleInput,
    outputSchema: elementRoleOutput,
    annotations: {
      title: 'Get Element Role',
      readOnlyHint: true,
      idempotentHint: true,
      destructiveHint: false,
    },
    execute: async (input: { selector: string }) => {
      const entryId = addEntry('get_element_role', `Reading accessible role/name for ${input.selector}...`);
      const result = plainElementRoleInfo(getElementRoleInfo(input.selector));
      updateEntry(entryId, {
        message: `${input.selector} is exposed as "${result.role}" named "${result.accessibleName}".`,
        status: 'complete',
      });
      return result;
    },
  });

  useWebMCP({
    name: 'report_violation',
    description:
      'Proposes an accessibility violation finding for human review. This does NOT log the violation ' +
      'directly — it stages it for confirmation in the narration panel, where a human approves or dismisses it.',
    inputSchema: reportViolationInput,
    outputSchema: reportViolationOutput,
    annotations: {
      title: 'Report Violation (requires human confirmation)',
      readOnlyHint: false,
      idempotentHint: false,
      destructiveHint: false,
    },
    execute: async (input: ReportViolationInput) => {
      const entryId = addEntry('report_violation', `Flagging a possible violation: ${input.description}`);
      const pendingId = proposeViolation(input);
      updateEntry(entryId, {
        message: `Awaiting your confirmation — see the pending finding below.`,
        status: 'flagged',
      });
      return { pendingId, status: 'awaiting_human_confirmation' };
    },
  });

  useWebMCP({
    name: 'get_violation_log',
    description:
      'Returns the total count of confirmed violations plus the 3 most recent, in full detail. Summarized ' +
      'rather than exhaustive to stay within tool output size limits.',
    outputSchema: violationLogOutput,
    annotations: {
      title: 'Get Violation Log',
      readOnlyHint: true,
      idempotentHint: true,
      destructiveHint: false,
    },
    execute: async () => {
      const all = violationsRef.current;
      const entryId = addEntry('get_violation_log', 'Retrieving the confirmed violation log...');
      updateEntry(entryId, { message: `${all.length} confirmed violation(s) on record.`, status: 'complete' });
      return { totalCount: all.length, recent: all.slice(-3).reverse().map(plainViolation) };
    },
  });
}
