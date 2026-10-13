import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Hexagon } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useUpdateTodo } from '@/api/hooks/useTodos';
import { TodoResponse } from 'shared-schemas';
import { TodoDialog } from './todo-dialog';

interface TodoListProps {
  todos: TodoResponse[];
  emptyMessage?: string;
  /** Hide the hive badge — useful when the list is already scoped to one hive. */
  hideHive?: boolean;
}

export function TodoList({ todos, emptyMessage, hideHive }: TodoListProps) {
  const { t, i18n } = useTranslation('todo');
  const updateTodo = useUpdateTodo();
  const [selectedTodo, setSelectedTodo] = useState<TodoResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Optimistic in useUpdateTodo; the hook rolls back and logs on failure.
  const toggleCompleted = (todo: TodoResponse, completed: boolean) => {
    updateTodo.mutate({ id: todo.id, data: { completed } });
  };

  const openTodo = (todo: TodoResponse) => {
    setSelectedTodo(todo);
    setDialogOpen(true);
  };

  const dateFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    [i18n.language],
  );

  if (todos.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        {emptyMessage ?? t('list.empty')}
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {todos.map(todo => (
          <li
            key={todo.id}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={todo.completed}
              onCheckedChange={checked =>
                toggleCompleted(todo, checked === true)
              }
              aria-label={t('actions.toggleComplete')}
            />
            <button
              type="button"
              onClick={() => openTodo(todo)}
              className="flex-1 min-w-0 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={cn(
                  'block truncate',
                  todo.completed && 'line-through text-muted-foreground',
                )}
              >
                {todo.title}
              </span>
              {(todo.dueDate || (todo.hiveName && !hideHive)) && (
                <span className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                  {todo.dueDate && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3" />
                      {dateFormat.format(new Date(todo.dueDate))}
                    </span>
                  )}
                  {todo.hiveName && !hideHive && (
                    <span className="flex items-center gap-1">
                      <Hexagon className="size-3" />
                      {todo.hiveName}
                    </span>
                  )}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <TodoDialog
        // Remount per todo so the form initialises from it (no sync effect).
        key={selectedTodo?.id}
        todo={selectedTodo}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}

/** Row-shaped placeholder matching TodoList while todos load. */
export function TodoListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="divide-y overflow-hidden rounded-xl border bg-card">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}
