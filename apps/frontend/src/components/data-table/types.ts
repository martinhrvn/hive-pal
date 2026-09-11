import type { ReactNode } from 'react';

/**
 * A declarative column definition shared by the generic {@link DataTable} and
 * the column-visibility machinery. Any table that wants user-toggleable columns
 * describes its columns as `DataTableColumn<T>[]` and renders them through the
 * `DataTable` component together with `useColumnVisibility`.
 */
export interface DataTableColumn<T> {
  /** Stable id — used as the React key and the localStorage visibility key. */
  id: string;
  /** Header cell content. */
  header: ReactNode;
  /** Renders a body cell for a row. Receives the row, its index and all rows. */
  cell: (row: T, index: number, rows: T[]) => ReactNode;
  /**
   * Label shown in the column-visibility menu. Falls back to `header` when that
   * is a plain string, otherwise to `id`.
   */
  menuLabel?: string;
  /** Whether the user may hide this column. Defaults to `true`. */
  canHide?: boolean;
  /** Hidden until the user enables it (only meaningful when `canHide`). */
  defaultHidden?: boolean;
  /** Extra classes for the header cell. */
  headerClassName?: string;
  /** Extra classes for the body cells. */
  cellClassName?: string;
}

/** Map of column id → whether it is currently visible. */
export type ColumnVisibility = Record<string, boolean>;

/** The label a column contributes to the visibility menu. */
export const columnMenuLabel = <T>(column: DataTableColumn<T>): string =>
  column.menuLabel ??
  (typeof column.header === 'string' ? column.header : column.id);
