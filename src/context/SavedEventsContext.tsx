import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import type { Event } from '../types';

interface SavedEventsContextType {
  savedEvents: Event[];
  isSaved: (id: string) => boolean;
  toggleSave: (event: Event) => Promise<void>;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SavedEventsContext = createContext<SavedEventsContextType | null>(null);

export function SavedEventsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!session) {
      setSavedEvents([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getSavedEvents();
      setSavedEvents(Array.isArray(data) ? data : []);
    } catch {
      // keep whatever we had; saved state is non-critical
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const savedIds = useMemo(
    () => new Set(savedEvents.map(e => e.id)),
    [savedEvents],
  );

  const toggleSave = useCallback(
    async (event: Event) => {
      const currentlySaved = savedIds.has(event.id);
      // Optimistic update.
      setSavedEvents(prev =>
        currentlySaved
          ? prev.filter(e => e.id !== event.id)
          : [event, ...prev],
      );
      try {
        if (currentlySaved) {
          await api.unsaveEvent(event.id);
        } else {
          await api.saveEvent(event.id);
        }
      } catch {
        // Revert on failure.
        setSavedEvents(prev =>
          currentlySaved
            ? [event, ...prev]
            : prev.filter(e => e.id !== event.id),
        );
      }
    },
    [savedIds],
  );

  const value = useMemo<SavedEventsContextType>(
    () => ({
      savedEvents,
      isSaved: (id: string) => savedIds.has(id),
      toggleSave,
      loading,
      refresh,
    }),
    [savedEvents, savedIds, toggleSave, loading, refresh],
  );

  return (
    <SavedEventsContext.Provider value={value}>
      {children}
    </SavedEventsContext.Provider>
  );
}

export function useSavedEvents() {
  const ctx = useContext(SavedEventsContext);
  if (!ctx) {
    throw new Error('useSavedEvents must be used inside <SavedEventsProvider>');
  }
  return ctx;
}
