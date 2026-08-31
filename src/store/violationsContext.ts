import { createContext } from 'react';
import type { Violation, PendingViolation } from '../types/accessibility';

export interface ViolationsContextValue {
  violations: Violation[];
  pending: (PendingViolation & { pendingId: string })[];
  proposeViolation: (payload: PendingViolation) => string;
  confirmViolation: (pendingId: string) => void;
  dismissViolation: (pendingId: string) => void;
}

export const ViolationsContext = createContext<ViolationsContextValue | null>(null);
