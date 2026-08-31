import { useReducer, type ReactNode } from 'react';
import type { Violation, PendingViolation } from '../types/accessibility';
import { generateId } from '../utils/id';
import { ViolationsContext, type ViolationsContextValue } from './violationsContext';

/**
 * The provider component, kept in its own file separate from the context
 * definition and the `useViolationsStore` hook (see violationsContext.ts
 * and useViolationsStore.ts) — a file that exports both a component and
 * non-component values breaks React Fast Refresh, which oxlint correctly
 * flags. Splitting keeps hot-reload fast during development.
 */

interface PendingEntry extends PendingViolation {
  pendingId: string;
}

interface State {
  violations: Violation[];
  pending: PendingEntry[];
}

type Action =
  | { type: 'PROPOSE'; payload: PendingEntry }
  | { type: 'CONFIRM'; pendingId: string }
  | { type: 'DISMISS'; pendingId: string };

const initialState: State = { violations: [], pending: [] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'PROPOSE':
      return { ...state, pending: [...state.pending, action.payload] };

    case 'CONFIRM': {
      const entry = state.pending.find((p) => p.pendingId === action.pendingId);
      if (!entry) return state;
      const { pendingId: _drop, ...rest } = entry;
      const confirmed: Violation = {
        ...rest,
        id: generateId('violation'),
        timestamp: new Date().toISOString(),
        confirmed: true,
      };
      return {
        violations: [...state.violations, confirmed],
        pending: state.pending.filter((p) => p.pendingId !== action.pendingId),
      };
    }

    case 'DISMISS':
      return { ...state, pending: state.pending.filter((p) => p.pendingId !== action.pendingId) };

    default:
      return state;
  }
}

export function ViolationsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  function proposeViolation(payload: PendingViolation): string {
    const pendingId = generateId('pending');
    dispatch({ type: 'PROPOSE', payload: { ...payload, pendingId } });
    return pendingId;
  }

  function confirmViolation(pendingId: string): void {
    dispatch({ type: 'CONFIRM', pendingId });
  }

  function dismissViolation(pendingId: string): void {
    dispatch({ type: 'DISMISS', pendingId });
  }

  const value: ViolationsContextValue = {
    ...state,
    proposeViolation,
    confirmViolation,
    dismissViolation,
  };

  return <ViolationsContext.Provider value={value}>{children}</ViolationsContext.Provider>;
}
