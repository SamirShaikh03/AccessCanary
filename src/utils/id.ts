/**
 * Lightweight ID generator. Deliberately not pulling in the `uuid` package
 * for this — `crypto.randomUUID()` is natively available in every modern
 * browser this project targets, so an extra dependency would add bundle
 * weight for zero benefit (tree-shaking / dead-code elimination principle:
 * best practice #15 — the leanest solution is not adding the code at all).
 */
export function generateId(prefix: string): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${uuid}`;
}
