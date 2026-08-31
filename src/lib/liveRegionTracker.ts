import type { AriaLiveState } from '../types/accessibility';

/**
 * Tracks whether ARIA-live regions actually announce their changes.
 *
 * A single MutationObserver watches the whole document for content
 * mutations. Whenever something changes inside an element that carries
 * `aria-live`, that element is recorded as "fired." This is exactly the
 * gap a static scanner can't see: axe-core can confirm an `aria-live`
 * attribute exists, but it cannot tell you whether the region ever
 * actually updated in response to user interaction — that only shows up
 * by observing the page while it's being used, which is the whole thesis
 * of this project.
 */

const firedRegions = new WeakSet<Element>();
let observer: MutationObserver | null = null;

export function initLiveRegionObserver(): void {
  if (observer) return; // idempotent — safe to call from multiple mount points

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const node = mutation.target;
      const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
      const liveRegion = el?.closest('[aria-live]');
      if (liveRegion) firedRegions.add(liveRegion);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

/** get_aria_live_state logic. */
export function getAriaLiveState(selector: string): AriaLiveState {
  const el = document.querySelector(selector);
  if (!el) {
    return { selector, isLive: false, politeness: 'off', firedOnLastChange: false };
  }
  const politenessAttr = el.getAttribute('aria-live');
  return {
    selector,
    isLive: el.hasAttribute('aria-live'),
    politeness: politenessAttr === 'assertive' ? 'assertive' : politenessAttr === 'polite' ? 'polite' : 'off',
    firedOnLastChange: firedRegions.has(el),
  };
}
