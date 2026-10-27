import { createContext, useContext } from 'react';
import type { Season } from 'shared-schemas';
import { randomUUID } from '@/lib/uuid';

export interface SeasonFormValues {
  seasons: Season[];
}

/** A new, empty season. Dates are a starting point the user can change. */
export function createSeason(
  start?: { month: number; day: number },
  end?: { month: number; day: number },
): Season {
  return {
    id: randomUUID(),
    name: '',
    start: start ?? { month: 3, day: 1 },
    end: end ?? { month: 5, day: 31 },
    inspectionFrequencyDays: null,
    feeding: { enabled: false, targetKg: null },
  };
}

export interface SeasonEditorContextValue {
  /** Field-array entries; `id` is the array's own key, not the season id. */
  fields: { id: string }[];
  /** The one season open in the editor, by its own id. */
  editingId: string | null;
  /** Open a season (closing any other) or close it. */
  setEditing: (id: string, editing: boolean) => void;
  /** Append a season (optionally spanning a date range) and open it. */
  addSeason: (
    start?: { month: number; day: number },
    end?: { month: number; day: number },
  ) => void;
  /** Remove a season by its own id. */
  removeSeason: (id: string) => void;
}

export const SeasonEditorContext =
  createContext<SeasonEditorContextValue | null>(null);

/**
 * The shared season-array editing state, or `null` outside a
 * `SeasonsEditorProvider`. Consumers render read-only when this is null.
 */
export function useSeasonEditor(): SeasonEditorContextValue | null {
  return useContext(SeasonEditorContext);
}
