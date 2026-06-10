import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  MainContent,
  PageGrid,
  PageAside,
} from '@/components/layout/page-grid-layout';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  ActionSidebarContainer,
  ActionSidebarGroup,
} from '@/components/sidebar';
import { RefreshButton } from '@/components/sidebar/refresh-button';
import { useTodos } from '@/api/hooks/useTodos';
import { TodoQuickAdd } from './components/todo-quick-add';
import { TodoList } from './components/todo-list';

export const TodoListPage = () => {
  const { t } = useTranslation(['todo', 'common']);
  const { data, isLoading, refetch } = useTodos();
  const [showCompleted, setShowCompleted] = useState(false);

  const allTodos = data ?? [];
  const todos = showCompleted
    ? allTodos
    : allTodos.filter(todo => !todo.completed);

  return (
    <PageGrid>
      <MainContent>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{t('todo:list.title')}</h1>
            <p className="text-muted-foreground">{t('todo:list.caption')}</p>
          </div>

          <TodoQuickAdd />

          <div className="flex items-center justify-end gap-2">
            <Switch
              id="show-completed"
              checked={showCompleted}
              onCheckedChange={setShowCompleted}
            />
            <Label htmlFor="show-completed" className="text-sm">
              {t('todo:list.showCompleted')}
            </Label>
          </div>

          {isLoading ? (
            <div>{t('common:status.loading')}</div>
          ) : (
            <TodoList todos={todos} />
          )}
        </div>
      </MainContent>
      <PageAside>
        <ActionSidebarContainer>
          <ActionSidebarGroup title={t('common:actions.actions')}>
            <RefreshButton
              onRefresh={() => refetch()}
              i18nNamespace="common"
              label={t('common:actions.refreshData')}
            />
          </ActionSidebarGroup>
        </ActionSidebarContainer>
      </PageAside>
    </PageGrid>
  );
};
