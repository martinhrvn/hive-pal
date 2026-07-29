import { SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { columnMenuLabel, type DataTableColumn } from './types';

interface ColumnVisibilityMenuProps<T> {
  /** The columns the user may toggle (typically `hideableColumns` from the hook). */
  columns: DataTableColumn<T>[];
  isColumnVisible: (id: string) => boolean;
  setColumnVisible: (id: string, visible: boolean) => void;
  resetColumns: () => void;
  /** Total number of currently-visible columns — used to keep at least one on. */
  visibleCount: number;
  /** Whether the user has diverged from the defaults (enables "Reset"). */
  isCustomised?: boolean;
  /** Optional trigger label; defaults to a translated "Columns". */
  label?: string;
  align?: 'start' | 'center' | 'end';
}

/**
 * A reusable dropdown that toggles the visible columns of a {@link DataTable}.
 * Drop it into any table's toolbar next to `useColumnVisibility`.
 */
export function ColumnVisibilityMenu<T>({
  columns,
  isColumnVisible,
  setColumnVisible,
  resetColumns,
  visibleCount,
  isCustomised = false,
  label,
  align = 'end',
}: ColumnVisibilityMenuProps<T>) {
  const { t } = useTranslation('common');
  if (columns.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          {label ?? t('table.columns', { defaultValue: 'Columns' })}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-52">
        <DropdownMenuLabel>
          {t('table.toggleColumns', { defaultValue: 'Toggle columns' })}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map(column => {
          const visible = isColumnVisible(column.id);
          // Never let the user hide the final visible column.
          const isLastVisible = visible && visibleCount <= 1;
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={visible}
              disabled={isLastVisible}
              // Keep the menu open so several columns can be toggled at once.
              onSelect={event => event.preventDefault()}
              onCheckedChange={checked => setColumnVisible(column.id, !!checked)}
            >
              {columnMenuLabel(column)}
            </DropdownMenuCheckboxItem>
          );
        })}
        {isCustomised && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => resetColumns()}>
              {t('table.resetColumns', { defaultValue: 'Reset to default' })}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
