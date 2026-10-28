import { useMemo, useState, type ReactNode } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import type { Season } from 'shared-schemas';
import { longestFreeRange } from '@/utils/season-strip';
import {
  SeasonEditorContext,
  createSeason,
  type SeasonEditorContextValue,
  type SeasonFormValues,
} from './season-editor-context';

/**
 * Owns the `seasons` field array plus the one season open for editing, so the year
 * strip and the card list can both add, edit and remove seasons. Must be
 * rendered inside the form (`FormProvider`).
 */
export function SeasonsEditorProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { control, getValues } = useFormContext<SeasonFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'seasons',
  });
  // One season at a time: two open editors read as one confusing form.
  const [editingId, setEditingId] = useState<string | null>(null);

  const value = useMemo<SeasonEditorContextValue>(() => {
    const setEditing = (id: string, editing: boolean) =>
      setEditingId(current => {
        if (editing) return id;
        return current === id ? null : current;
      });

    return {
      fields,
      editingId,
      setEditing,
      addSeason: (start, end) => {
        // Without dates, fill the longest stretch no season covers yet.
        const free = start
          ? undefined
          : longestFreeRange(getValues('seasons') ?? []);
        const season = createSeason(start ?? free?.start, end ?? free?.end);
        append(season);
        setEditing(season.id, true);
      },
      removeSeason: id => {
        const seasons = (getValues('seasons') ?? []) as Season[];
        const index = seasons.findIndex(season => season.id === id);
        if (index >= 0) remove(index);
      },
    };
  }, [fields, editingId, append, remove, getValues]);

  return (
    <SeasonEditorContext.Provider value={value}>
      {children}
    </SeasonEditorContext.Provider>
  );
}
