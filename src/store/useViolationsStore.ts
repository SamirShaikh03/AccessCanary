import { useContext } from 'react';
import { ViolationsContext, type ViolationsContextValue } from './violationsContext';

/** Access the violations store. Must be called within a ViolationsProvider. */
export function useViolationsStore(): ViolationsContextValue {
  const ctx = useContext(ViolationsContext);
  if (!ctx) throw new Error('useViolationsStore must be used within a ViolationsProvider');
  return ctx;
}
