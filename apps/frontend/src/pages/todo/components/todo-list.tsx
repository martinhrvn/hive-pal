import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Hexagon } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useUpdateTodo } from '@/api/hooks/useTodos';
import { TodoResponse } from 'shared-schemas';
import { TodoDialog } from './todo-dialog';

interface TodoListProps {
  todos: TodoResponse[];
  emptyMessage?: string;
}

export function TodoList({ todos, emptyMessage }: TodoListProps) {
  const { t, i18n } = useTranslation('todo');
  const updateTodo = useUpdateTodo();
  const [selectedTodo, setSelectedTodo] = useState<TodoResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggleCompleted = (todo: TodoResponse, completed: boolean) => {
    void updateTodo.mutateAsync({ id: todo.id, data: { completed } });
  };

  const openTodo = (todo: TodoResponse) => {
    setSelectedTodo(todo);
    setDialogOpen(true);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  if (todos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        {emptyMessage ?? t('list.empty')}
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y rounded-md border">
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
              className="flex-1 min-w-0 text-left"
            >
              <span
                className={cn(
                  'block truncate',
                  todo.completed && 'line-through text-muted-foreground',
                )}
              >
                {todo.title}
              </span>
              {(todo.dueDate || todo.hiveName) && (
                <span className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                  {todo.dueDate && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(todo.dueDate)}
                    </span>
                  )}
                  {todo.hiveName && (
                    <span className="flex items-center gap-1">
                      <Hexagon className="h-3 w-3" />
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
        todo={selectedTodo}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
