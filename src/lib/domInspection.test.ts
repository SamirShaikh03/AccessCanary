import { describe, it, expect, beforeEach } from 'vitest';
import { buildSelector, getAccessibleName, getAccessibleRole, getFocusOrder, getElementRoleInfo } from './domInspection';

describe('buildSelector', () => {
  it('prefers an id when present', () => {
    document.body.innerHTML = `<button id="submit-btn">Go</button>`;
    const el = document.getElementById('submit-btn')!;
    expect(buildSelector(el)).toBe('#submit-btn');
  });

  it('falls back to a tag + nth-of-type path when no id exists', () => {
    document.body.innerHTML = `<div><span>a</span><span>b</span></div>`;
    const second = document.querySelectorAll('span')[1];
    expect(buildSelector(second)).toBe('span:nth-of-type(2)');
  });
});

describe('getAccessibleName', () => {
  it('prioritizes aria-label over everything else', () => {
    document.body.innerHTML = `<button aria-label="Close dialog">X</button>`;
    const el = document.querySelector('button')!;
    expect(getAccessibleName(el)).toBe('Close dialog');
  });

  it('falls back to an associated <label for>', () => {
    document.body.innerHTML = `
      <label for="income">Annual income</label>
      <input id="income" />
    `;
    const el = document.getElementById('income')!;
    expect(getAccessibleName(el)).toBe('Annual income');
  });

  it('falls back to placeholder text for inputs with no label', () => {
    document.body.innerHTML = `<input placeholder="Search products" />`;
    const el = document.querySelector('input')!;
    expect(getAccessibleName(el)).toBe('Search products');
  });

  it('returns a clear marker when nothing identifies the element', () => {
    document.body.innerHTML = `<div tabindex="0"></div>`;
    const el = document.querySelector('div')!;
    expect(getAccessibleName(el)).toBe('(no accessible name found)');
  });
});

describe('getAccessibleRole', () => {
  it('respects an explicit role attribute over the tag default', () => {
    document.body.innerHTML = `<div role="button">Click</div>`;
    expect(getAccessibleRole(document.querySelector('div')!)).toBe('button');
  });

  it('infers "link" for an anchor with an href', () => {
    document.body.innerHTML = `<a href="/home">Home</a>`;
    expect(getAccessibleRole(document.querySelector('a')!)).toBe('link');
  });

  it('infers "spinbutton" for a numeric input', () => {
    document.body.innerHTML = `<input type="number" />`;
    expect(getAccessibleRole(document.querySelector('input')!)).toBe('spinbutton');
  });
});

describe('getFocusOrder — the tab-order bug this project exists to catch', () => {
  beforeEach(() => {
    // Mirrors BUG 1 from BenefitsForm: a positive tabIndex on the submit
    // button pulls it to the very front of the page's tab sequence, ahead
    // of every naturally-ordered field — exactly what a real user
    // experiences as "the first Tab press on this page jumps straight to
    // Submit." Wrapped in a non-focusable container so querying from the
    // container's own selector returns the full page order from the top,
    // the same way an agent inspecting "the whole form" naturally would.
    document.body.innerHTML = `
      <div id="form-container">
        <input id="name" />
        <input id="income" />
        <input id="household" />
        <button id="submit" tabindex="1">Submit</button>
        <div id="footer" tabindex="0">Footer link</div>
      </div>
    `;
  });

  it('places the positive-tabIndex element ahead of every naturally-ordered field', () => {
    const steps = getFocusOrder('#form-container', 10);
    const order = steps.map((s) => s.selector);

    // The whole point of the bug: #submit (tabindex=1) jumps to the very
    // front of the tab sequence, ahead of #name/#income/#household even
    // though all three appear earlier in the actual DOM. A naive "just
    // read document order" implementation would report #name first and
    // miss this entirely.
    expect(order[0]).toBe('#submit');
  });

  it('keeps zero/no-tabindex elements in their natural document order after the positive one', () => {
    const steps = getFocusOrder('#form-container', 10);
    const order = steps.map((s) => s.selector);
    const nameIndex = order.indexOf('#name');
    const incomeIndex = order.indexOf('#income');
    const householdIndex = order.indexOf('#household');

    expect(nameIndex).toBeGreaterThan(0); // after #submit at index 0
    expect(incomeIndex).toBeGreaterThan(nameIndex);
    expect(householdIndex).toBeGreaterThan(incomeIndex);
  });

  it('respects the limit parameter', () => {
    const steps = getFocusOrder('#form-container', 2);
    expect(steps).toHaveLength(2);
  });

  it('sorts multiple positive tabIndex elements by value, not DOM position', () => {
    document.body.innerHTML = `
      <div id="wrap">
        <button id="second" tabindex="2">Second</button>
        <button id="first" tabindex="1">First</button>
        <input id="normal" />
      </div>
    `;
    const order = getFocusOrder('#wrap', 10).map((s) => s.selector);
    // #first appears AFTER #second in the DOM but has the lower tabIndex,
    // so it must come first in the actual tab sequence.
    expect(order).toEqual(['#first', '#second', '#normal']);
  });
});

describe('getElementRoleInfo', () => {
  it('reports a graceful not-found result for a missing selector', () => {
    document.body.innerHTML = '';
    const result = getElementRoleInfo('#does-not-exist');
    expect(result.role).toBe('not-found');
  });

  it('captures aria-invalid state for a form field', () => {
    document.body.innerHTML = `<input id="income" aria-invalid="true" />`;
    const result = getElementRoleInfo('#income');
    expect(result.states['aria-invalid']).toBe(true);
  });
});
