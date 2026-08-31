import { useState, type ReactNode } from 'react';
import type { NarrationEntry } from '../types/accessibility';
import { generateId } from '../utils/id';
import { NarrationContext } from './narrationContext';

/** Feed is capped so a long demo session doesn't grow the DOM unbounded. */
const MAX_ENTRIES = 30;

export function NarrationProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<NarrationEntry[]>([]);

  function addEntry(toolName: string, message: string): string {
    const id = generateId('narration');
    const entry: NarrationEntry = {
      id,
      toolName,
      message,
      status: 'running',
      timestamp: new Date().toISOString(),
    };
    setEntries((prev) => [...prev.slice(-(MAX_ENTRIES - 1)), entry]);
    return id;
  }

  function updateEntry(id: string, patch: Partial<Pick<NarrationEntry, 'message' | 'status'>>): void {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  return (
    <NarrationContext.Provider value={{ entries, addEntry, updateEntry }}>
      {children}
    </NarrationContext.Provider>
  );
}
