import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useHiveOptions } from '@/api/hooks';
import { useUpdateTodo, useDeleteTodo } from '@/api/hooks/useTodos';
import { TodoResponse } from 'shared-schemas';

const NO_HIVE = '__none__';

interface TodoDialogProps {
  todo: TodoResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Convert an ISO datetime string to a yyyy-MM-dd value for a native date input.
const toDateInputValue = (iso?: string | null): string =>
  iso ? iso.slice(0, 10) : '';

export function TodoDialog({ todo, open, onOpenChange }: TodoDialogProps) {
  const { t } = useTranslation(['todo', 'common']);
  const { data: hiveOptions } = useHiveOptions();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [hiveId, setHiveId] = useState<string>(NO_HIVE);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description ?? '');
      setDueDate(toDateInputValue(todo.dueDate));
      setHiveId(todo.hiveId ?? NO_HIVE);
    }
  }, [todo]);

  const handleSave = async () => {
    if (!todo) return;
    if (!title.trim()) {
      toast.error(t('todo:validation.titleRequired'));
      return;
    }
    try {
      await updateTodo.mutateAsync({
        id: todo.id,
        data: {
          title: title.trim(),
          description: description.trim() || null,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          hiveId: hiveId === NO_HIVE ? null : hiveId,
        },
      });
      toast.success(t('todo:edit.success'));
      onOpenChange(false);
    } catch {
      toast.error(t('todo:edit.error'));
    }
  };

  const handleDelete = async () => {
    if (!todo) return;
    try {
      await deleteTodo.mutateAsync(todo.id);
      toast.success(t('todo:delete.success'));
      onOpenChange(false);
    } catch {
      toast.error(t('todo:delete.error'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('todo:edit.title')}</DialogTitle>
          <DialogDescription>{t('todo:edit.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="todo-title">{t('todo:fields.title')}</Label>
            <Input
              id="todo-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('todo:form.titlePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="todo-description">
              {t('todo:fields.description')}
            </Label>
            <Textarea
              id="todo-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('todo:form.descriptionPlaceholder')}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="todo-due-date">{t('todo:fields.dueDate')}</Label>
              <Input
                id="todo-due-date"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('todo:fields.hive')}</Label>
              <Select value={hiveId} onValueChange={setHiveId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('todo:form.hivePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_HIVE}>
                    {t('todo:form.noHive')}
                  </SelectItem>
                  {hiveOptions?.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleteTodo.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('common:actions.delete')}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateTodo.isPending}
          >
            {updateTodo.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t('common:actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
