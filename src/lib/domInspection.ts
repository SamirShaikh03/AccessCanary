import type { FocusStep, ElementRoleInfo } from '../types/accessibility';

/**
 * Pure DOM-inspection logic, deliberately kept framework-independent.
 *
 * Every function here takes a selector/element and returns plain data — no
 * React, no WebMCP. This is what the six tools in useAccessibilityTools.ts
 * call into, and it's what unit tests (Phase 4) exercise directly, without
 * needing to spin up a WebMCP registration to test the underlying logic.
 */

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

function isVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  // offsetParent requires a real layout engine and is always null under
  // jsdom (used in unit tests), so it can't be the sole visibility signal
  // — display/visibility above already catch the cases that matter for
  // this project's bugs, and offsetParent is an extra real-browser signal
  // layered on top rather than a hard requirement.
  return el.offsetParent !== null || !isLayoutEngineAvailable();
}

/** True in real browsers; false under jsdom, which has no layout engine. */
function isLayoutEngineAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.navigator !== 'undefined' && !window.navigator.userAgent.includes('jsdom');
}

/**
 * Returns elements in real browser tab order: elements with a positive
 * tabIndex come first (sorted by tabIndex value, per the HTML spec), then
 * everything else follows in document order. This is what makes BUG 1
 * (tabIndex={1} on the submit button) detectable — a naive "just read
 * document order" implementation would miss it entirely.
 */
function getTabOrder(): HTMLElement[] {
  const all = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisible);
  const positive = all.filter((el) => el.tabIndex > 0).sort((a, b) => a.tabIndex - b.tabIndex);
  const natural = all.filter((el) => el.tabIndex <= 0);
  return [...positive, ...natural];
}

/** Builds a reasonably stable, human-readable CSS selector for an element. */
export function buildSelector(el: Element): string {
  if (el.id) return `#${el.id}`;
  const tag = el.tagName.toLowerCase();
  const parent = el.parentElement;
  if (!parent) return tag;
  const siblings = Array.from(parent.children).filter((sib) => sib.tagName === el.tagName);
  const index = siblings.indexOf(el);
  return siblings.length > 1 ? `${tag}:nth-of-type(${index + 1})` : tag;
}

/** Heuristic accessible-name computation covering the common real-world cases. */
export function getAccessibleName(el: Element): string {
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const text = labelledBy
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent?.trim())
      .filter(Boolean)
      .join(' ');
    if (text) return text;
  }

  if (el.id) {
    const label = document.querySelector(`label[for="${el.id}"]`);
    if (label?.textContent) return label.textContent.trim();
  }

  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (el.placeholder) return el.placeholder;
  }

  return el.textContent?.trim().slice(0, 80) || '(no accessible name found)';
}

/** Heuristic accessible-role computation: explicit role wins, else tag-based defaults. */
export function getAccessibleRole(el: Element): string {
  const explicit = el.getAttribute('role');
  if (explicit) return explicit;

  const tag = el.tagName.toLowerCase();
  if (tag === 'a' && el.hasAttribute('href')) return 'link';
  if (tag === 'button') return 'button';
  if (tag === 'select') return 'combobox';
  if (tag === 'textarea') return 'textbox';
  if (tag === 'input') {
    const type = (el as HTMLInputElement).type;
    if (type === 'number') return 'spinbutton';
    if (type === 'checkbox') return 'checkbox';
    if (type === 'radio') return 'radio';
    return 'textbox';
  }
  return 'generic';
}

function describeElement(el: HTMLElement, order: number): FocusStep {
  return {
    selector: buildSelector(el),
    role: getAccessibleRole(el),
    accessibleLabel: getAccessibleName(el),
    order,
  };
}

/**
 * get_focus_order logic: returns the tab-order sequence starting at (and
 * including) the element matching `startSelector`, up to `limit` entries.
 */
export function getFocusOrder(startSelector: string, limit = 20): FocusStep[] {
  const order = getTabOrder();
  const startEl = document.querySelector<HTMLElement>(startSelector);
  const startIndex = startEl ? order.indexOf(startEl) : 0;
  const slice = order.slice(Math.max(startIndex, 0), Math.max(startIndex, 0) + limit);
  return slice.map((el, i) => describeElement(el, i));
}

/**
 * simulate_tab_sequence logic. Real browsers ignore the default action of
 * synthetic KeyboardEvents for security reasons, so a dispatched Tab
 * keydown cannot trigger native focus-navigation — only JS `keydown`
 * listeners (like the DatePickerTrap's own handler). This function models
 * real Tab behavior as closely as a demo page reasonably can: it dispatches
 * a real Tab keydown first (so custom handlers like the keyboard trap get
 * their real chance to run, exactly as they would for a real user), and
 * only falls back to our own computed tab-order array when nothing
 * intercepted the event — which is what happens for ordinary fields with
 * no custom key handling.
 */
export function simulateTabSequence(startSelector: string, steps: number): FocusStep[] {
  const order = getTabOrder();
  const startEl = document.querySelector<HTMLElement>(startSelector);
  if (startEl) startEl.focus();

  const path: FocusStep[] = [];
  if (document.activeElement instanceof HTMLElement) {
    path.push(describeElement(document.activeElement, 0));
  }

  for (let i = 1; i <= steps; i++) {
    const before = document.activeElement;
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    before?.dispatchEvent(event);

    if (document.activeElement === before) {
      // Nothing intercepted the event — advance via the natural tab order.
      const idx = order.indexOf(before as HTMLElement);
      const next = order[(idx + 1) % order.length];
      next?.focus();
    }

    if (document.activeElement instanceof HTMLElement) {
      path.push(describeElement(document.activeElement, i));
    }
  }

  return path;
}

/** get_element_role logic. */
export function getElementRoleInfo(selector: string): ElementRoleInfo {
  const el = document.querySelector(selector);
  if (!el) {
    return { selector, role: 'not-found', accessibleName: '', states: {} };
  }
  const states: Record<string, boolean | string> = {};
  for (const attr of ['aria-checked', 'aria-expanded', 'aria-disabled', 'aria-required', 'aria-invalid']) {
    const value = el.getAttribute(attr);
    if (value !== null) states[attr] = value === 'true' ? true : value === 'false' ? false : value;
  }
  if (el instanceof HTMLInputElement) states.disabled = el.disabled;

  return {
    selector,
    role: getAccessibleRole(el),
    accessibleName: getAccessibleName(el),
    states,
  };
}
