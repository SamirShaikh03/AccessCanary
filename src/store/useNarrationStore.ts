import { useContext } from 'react';
import { NarrationContext, type NarrationContextValue } from './narrationContext';

/** Access the narration feed. Must be called within a NarrationProvider. */
export function useNarrationStore(): NarrationContextValue {
  const ctx = useContext(NarrationContext);
  if (!ctx) throw new Error('useNarrationStore must be used within a NarrationProvider');
  return ctx;
}
