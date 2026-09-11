import type { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { DataTableColumn } from './types';

interface DataTableProps<T> {
  /**
   * Columns to render, already filtered to the visible set (typically
   * `visibleColumns` from `useColumnVisibility`).
   */
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  caption?: ReactNode;
  /** Rendered instead of the table when there are no rows. */
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
}

/**
 * A thin, presentation-only table over the shadcn table primitives, driven by
 * declarative {@link DataTableColumn} definitions. Combine with
 * `useColumnVisibility` + `ColumnVisibilityMenu` for user-toggleable columns.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  emptyState,
  onRowClick,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return emptyState ? <>{emptyState}</> : null;
  }

  return (
    <Table containerClassName="scroll-shadow-x">
      {caption && <TableCaption>{caption}</TableCaption>}
      <TableHeader>
        <TableRow>
          {columns.map(column => (
            <TableHead key={column.id} className={column.headerClassName}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow
            key={rowKey(row, index)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(onRowClick && 'cursor-pointer')}
          >
            {columns.map(column => (
              <TableCell key={column.id} className={column.cellClassName}>
                {column.cell(row, index, rows)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
