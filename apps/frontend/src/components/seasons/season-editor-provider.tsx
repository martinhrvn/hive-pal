import { useMemo, useState, type ReactNode } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import type { Season } from 'shared-schemas';
import {
  SeasonEditorContext,
  createSeason,
  type SeasonEditorContextValue,
  type SeasonFormValues,
} from './season-editor-context';

/**
 * Owns the `seasons` field array plus which seasons are expanded, so the year
 * strip and the card list can both add, edit and remove seasons. Must be
 * rendered inside the form (`FormProvider`).
 */
export function SeasonsEditorProvider({ children }: { children: ReactNode }) {
  const { control, getValues } = useFormContext<SeasonFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'seasons',
  });
  const [editingIds, setEditingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const value = useMemo<SeasonEditorContextValue>(() => {
    const setEditing = (id: string, editing: boolean) =>
      setEditingIds(current => {
        const next = new Set(current);
        if (editing) next.add(id);
        else next.delete(id);
        return next;
      });

    return {
      fields,
      editingIds,
      setEditing,
      addSeason: (start, end) => {
        const season = createSeason(start, end);
        append(season);
        setEditing(season.id, true);
      },
      removeSeason: id => {
        const seasons = (getValues('seasons') ?? []) as Season[];
        const index = seasons.findIndex(season => season.id === id);
        if (index >= 0) remove(index);
      },
    };
  }, [fields, editingIds, append, remove, getValues]);

  return (
    <SeasonEditorContext.Provider value={value}>
      {children}
    </SeasonEditorContext.Provider>
  );
}
