import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateTodo } from '@/api/hooks/useTodos';

export function TodoQuickAdd() {
  const { t } = useTranslation('todo');
  const [title, setTitle] = useState('');
  const createTodo = useCreateTodo();

  const handleAdd = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await createTodo.mutateAsync({ title: trimmed });
    setTitle('');
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void handleAdd();
          }
        }}
        placeholder={t('quickAdd.placeholder')}
        aria-label={t('quickAdd.placeholder')}
      />
      <Button
        type="button"
        onClick={() => void handleAdd()}
        disabled={!title.trim() || createTodo.isPending}
      >
        {createTodo.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        <span className="ml-2 hidden sm:inline">{t('quickAdd.button')}</span>
      </Button>
    </div>
  );
}
