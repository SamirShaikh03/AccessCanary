/**
 * Core domain types for AccessCanary.
 *
 * Kept in one small file deliberately — these types are shared across the
 * mock form, the WebMCP tools, and the narration panel, so they need a
 * single source of truth rather than being redefined per-module.
 *
 * These stay as plain, strict interfaces — no index signatures here. The
 * WebMCP tool layer (useAccessibilityTools.ts) is responsible for shaping
 * plain object literals that match its JSON-Schema-derived output types;
 * that's a concern of the tool boundary, not the domain model, so it's
 * kept out of these shared types.
 */

/** Severity of a detected accessibility violation. */
export type ViolationSeverity = 'critical' | 'serious' | 'moderate';

/** The three violation categories this demo is built to surface. */
export type ViolationCategory =
  | 'focus-order'
  | 'silent-live-region'
  | 'keyboard-trap';

/** Bounded observation retained as proof for a human-reviewed finding. */
export interface AuditEvidence {
  toolName: string;
  selector: string;
  summary: string;
  details: string[];
  observedAt: string;
}

/** A single accessibility violation, as reported by the agent. */
export interface Violation {
  id: string;
  category: ViolationCategory;
  severity: ViolationSeverity;
  /** Human-readable description of what was observed. */
  description: string;
  /** CSS selector or element reference where the issue was found. */
  selector: string;
  /** ISO timestamp of when the violation was logged. */
  timestamp: string;
  /** Whether a human has confirmed this finding (vs. agent-proposed only). */
  confirmed: boolean;
  /** The latest live observation that supports this finding. */
  evidence?: AuditEvidence;
}

/** A violation the agent wants to log but hasn't been confirmed yet. */
export type PendingViolation = Omit<Violation, 'id' | 'timestamp' | 'confirmed'>;

/** One entry in the observed tab-order sequence. */
export interface FocusStep {
  selector: string;
  role: string;
  accessibleLabel: string;
  /** Position in the sequence, starting at 0. */
  order: number;
}

/** The current state of an ARIA-live region. */
export interface AriaLiveState {
  selector: string;
  isLive: boolean;
  politeness: 'polite' | 'assertive' | 'off';
  /** Whether the region actually announced content on its last mutation. */
  firedOnLastChange: boolean;
}

/** Accessible role/name/state snapshot for a single element. */
export interface ElementRoleInfo {
  selector: string;
  role: string;
  accessibleName: string;
  states: Record<string, boolean | string>;
}

/**
 * A single entry in the live "what the agent is doing" narration feed.
 * This is UI-facing, not part of the WebMCP tool contract itself.
 */
export interface NarrationEntry {
  id: string;
  toolName: string;
  message: string;
  status: 'running' | 'complete' | 'flagged';
  timestamp: string;
}
