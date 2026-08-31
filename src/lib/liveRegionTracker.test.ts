import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initLiveRegionObserver, getAriaLiveState } from './liveRegionTracker';

describe('getAriaLiveState — the silent live-region bug this project exists to catch', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    initLiveRegionObserver();
  });

  it('reports isLive: false for a region with no aria-live attribute at all', () => {
    document.body.innerHTML = `<p id="error">Something went wrong</p>`;
    const result = getAriaLiveState('#error');
    expect(result.isLive).toBe(false);
    expect(result.politeness).toBe('off');
  });

  it('reports firedOnLastChange: false for a live region that has never mutated', () => {
    document.body.innerHTML = `<p id="status" aria-live="polite"></p>`;
    const result = getAriaLiveState('#status');
    expect(result.isLive).toBe(true);
    expect(result.firedOnLastChange).toBe(false);
  });

  it('reports firedOnLastChange: true once a live region actually mutates', async () => {
    document.body.innerHTML = `<p id="status" aria-live="polite"></p>`;
    const el = document.getElementById('status')!;
    el.textContent = 'Form submitted successfully';

    // MutationObserver callbacks run as a microtask — flush before asserting.
    await vi.waitFor(() => {
      const result = getAriaLiveState('#status');
      expect(result.firedOnLastChange).toBe(true);
    });
  });

  it('returns a safe default for a selector that matches nothing', () => {
    document.body.innerHTML = '';
    const result = getAriaLiveState('#missing');
    expect(result.isLive).toBe(false);
    expect(result.firedOnLastChange).toBe(false);
  });
});
