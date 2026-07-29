# DataTable + column visibility

A small, dependency-free system for tables with **user-toggleable, persisted
columns**. Built on the shadcn table primitives — no `@tanstack/react-table`.

Three pieces:

- `DataTable` — renders rows from declarative `DataTableColumn<T>[]`.
- `useColumnVisibility(tableId, columns)` — per-table visibility, persisted to
  `localStorage` under `hive_pal_table_columns:<tableId>`.
- `ColumnVisibilityMenu` — the "Columns" dropdown for a table's toolbar.

## Adding it to a table

```tsx
import {
  DataTable,
  ColumnVisibilityMenu,
  useColumnVisibility,
  type DataTableColumn,
} from '@/components/data-table';

// 1. Describe the columns (memoise so visibility state stays stable).
const columns = useMemo<DataTableColumn<Row>[]>(
  () => [
    { id: 'name', header: t('fields.name'), cell: row => row.name },
    { id: 'date', header: t('fields.date'), cell: row => fmt(row.date) },
    // Non-hideable columns (e.g. an actions column) set canHide: false.
    {
      id: 'actions',
      header: '',
      canHide: false,
      cellClassName: 'text-right',
      cell: row => <RowActions row={row} />,
    },
  ],
  [t],
);

// 2. Wire up visibility (tableId must be unique & stable).
const {
  visibleColumns,
  hideableColumns,
  isColumnVisible,
  setColumnVisible,
  resetColumns,
  isCustomised,
} = useColumnVisibility('my-table', columns);

// 3. Toolbar button + table.
<ColumnVisibilityMenu
  columns={hideableColumns}
  isColumnVisible={isColumnVisible}
  setColumnVisible={setColumnVisible}
  resetColumns={resetColumns}
  visibleCount={visibleColumns.length}
  isCustomised={isCustomised}
/>;

<DataTable
  columns={visibleColumns}
  rows={rows}
  rowKey={row => row.id}
  emptyState={<EmptyState />}
/>;
```

## Notes

- **`canHide: false`** columns are always visible and never appear in the menu.
- **`defaultHidden: true`** starts a column off until the user enables it.
- The menu never lets the user hide the *last* visible column.
- Unknown/removed column ids in the stored value are ignored; columns added
  later show at their declared default — so persistence degrades gracefully as
  a table's columns change over time.
- The first adopter is `pages/inspection/inspection-list-page.tsx` (tableId
  `inspections`).
