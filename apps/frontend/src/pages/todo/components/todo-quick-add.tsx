import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateTodo } from '@/api/hooks/useTodos';

interface TodoQuickAddProps {
  /** When set, new todos are assigned to this hive. */
  hiveId?: string;
}

export function TodoQuickAdd({ hiveId }: TodoQuickAddProps) {
  const { t } = useTranslation('todo');
  const [title, setTitle] = useState('');
  const createTodo = useCreateTodo();

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = title.trim();
    // Guard against a second Enter while the first create is in flight.
    if (!trimmed || createTodo.isPending) return;
    try {
      await createTodo.mutateAsync({ title: trimmed, hiveId });
      setTitle('');
    } catch {
      toast.error(t('quickAdd.error', 'Could not add the todo'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder={t('quickAdd.placeholder')}
        aria-label={t('quickAdd.placeholder')}
      />
      <Button
        type="submit"
        disabled={!title.trim() || createTodo.isPending}
        aria-label={t('quickAdd.button')}
      >
        {createTodo.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        <span className="hidden sm:inline">{t('quickAdd.button')}</span>
      </Button>
    </form>
  );
}
