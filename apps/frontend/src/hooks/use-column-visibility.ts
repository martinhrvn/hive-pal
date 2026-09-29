import { useCallback, useMemo, useState } from 'react';
import type {
  ColumnVisibility,
  DataTableColumn,
} from '@/components/data-table/types';

const STORAGE_PREFIX = 'hive_pal_table_columns:';

const readStored = (key: string): ColumnVisibility => {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ColumnVisibility) : {};
  } catch {
    return {};
  }
};

export interface UseColumnVisibilityResult<T> {
  /** Effective visibility for every column id. */
  visibility: ColumnVisibility;
  isColumnVisible: (id: string) => boolean;
  setColumnVisible: (id: string, visible: boolean) => void;
  /** Clears the user's overrides, returning every column to its default. */
  resetColumns: () => void;
  /** Columns that are currently visible, in their declared order. */
  visibleColumns: DataTableColumn<T>[];
  /** Columns the user is allowed to toggle (for the visibility menu). */
  hideableColumns: DataTableColumn<T>[];
  /** True when the user has customised the visibility away from the defaults. */
  isCustomised: boolean;
}

/**
 * Persisted, per-table column visibility. Keyed by `tableId` in localStorage so
 * a user's choice survives reloads and is scoped to that specific table.
 *
 * Columns with `canHide === false` are always visible. Unknown/removed columns
 * in the stored value are ignored, and columns added later appear at their
 * declared default — so the feature degrades gracefully as tables evolve.
 *
 * Pass a **stable** (memoised) `columns` array to avoid needless recomputation.
 */
export function useColumnVisibility<T>(
  tableId: string,
  columns: DataTableColumn<T>[],
): UseColumnVisibilityResult<T> {
  const storageKey = `${STORAGE_PREFIX}${tableId}`;
  const [stored, setStored] = useState<ColumnVisibility>(() =>
    readStored(storageKey),
  );

  const visibility = useMemo<ColumnVisibility>(() => {
    const result: ColumnVisibility = {};
    for (const column of columns) {
      if (column.canHide === false) {
        result[column.id] = true;
        continue;
      }
      const userChoice = stored[column.id];
      result[column.id] = userChoice ?? !column.defaultHidden;
    }
    return result;
  }, [columns, stored]);

  const persist = useCallback(
    (next: ColumnVisibility) => {
      setStored(next);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(next));
        }
      } catch {
        /* storage unavailable — keep the in-memory value */
      }
    },
    [storageKey],
  );

  const setColumnVisible = useCallback(
    (id: string, visible: boolean) => {
      persist({ ...stored, [id]: visible });
    },
    [persist, stored],
  );

  const resetColumns = useCallback(() => {
    setStored({});
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(storageKey);
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const visibleColumns = useMemo(
    () => columns.filter(column => visibility[column.id]),
    [columns, visibility],
  );
  const hideableColumns = useMemo(
    () => columns.filter(column => column.canHide !== false),
    [columns],
  );
  const isCustomised = useMemo(
    () => hideableColumns.some(column => stored[column.id] !== undefined),
    [hideableColumns, stored],
  );

  const isColumnVisible = useCallback(
    (id: string) => !!visibility[id],
    [visibility],
  );

  return {
    visibility,
    isColumnVisible,
    setColumnVisible,
    resetColumns,
    visibleColumns,
    hideableColumns,
    isCustomised,
  };
}
