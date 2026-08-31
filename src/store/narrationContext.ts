import { createContext } from 'react';
import type { NarrationEntry } from '../types/accessibility';

export interface NarrationContextValue {
  entries: NarrationEntry[];
  /** Adds a new "running" entry and returns its id, for later updating. */
  addEntry: (toolName: string, message: string) => string;
  /** Updates an existing entry's message/status once a tool call resolves. */
  updateEntry: (id: string, patch: Partial<Pick<NarrationEntry, 'message' | 'status'>>) => void;
}

export const NarrationContext = createContext<NarrationContextValue | null>(null);
