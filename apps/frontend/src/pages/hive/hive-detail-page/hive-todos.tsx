import { useTranslation } from 'react-i18next';
import { ListTodo } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTodos } from '@/api/hooks/useTodos';
import { useApiaryPermission } from '@/hooks/useApiaryPermission';
import { TodoQuickAdd, TodoList } from '@/pages/todo';

interface HiveTodosProps {
  hiveId: string;
}

export const HiveTodos = ({ hiveId }: HiveTodosProps) => {
  const { t } = useTranslation('todo');
  const { data } = useTodos();
  const { canEdit } = useApiaryPermission();

  // Only this hive's open todos. Apiary-general (unassigned) todos live on the
  // dashboard and the /todos page, not on individual hive pages.
  const hiveTodos = (data ?? []).filter(
    todo => todo.hiveId === hiveId && !todo.completed,
  );

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListTodo className="h-4 w-4" />
          {t('hive.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {canEdit && <TodoQuickAdd hiveId={hiveId} />}
        <TodoList todos={hiveTodos} emptyMessage={t('hive.empty')} hideHive />
      </CardContent>
    </Card>
  );
};
