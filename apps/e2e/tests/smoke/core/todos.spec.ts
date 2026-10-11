import { TodoListPage } from 'page-objects';
import { expect, test, uniqueName } from '../fixtures';

test.describe('Todos', { tag: ['@core'] }, () => {
  test('quick-added todo can be completed and revealed with "Show completed"', async ({
    page,
    freshUser,
  }) => {
    void freshUser;
    const todos = new TodoListPage(page);
    const title = uniqueName('Smoke todo');

    await test.step('open /todos and quick-add a todo', async () => {
      await todos.goto();
      await expect(todos.heading).toBeVisible();
      await todos.quickAdd(title);
      await expect(todos.item(title)).toBeVisible();
    });

    await test.step('completing the todo hides it from the open list', async () => {
      await todos.toggleComplete(title);
      await expect(todos.item(title)).toHaveCount(0);
    });

    await test.step('"Show completed" reveals it again, ticked', async () => {
      await todos.showCompleted(true);
      await expect(todos.item(title)).toBeVisible();
      await expect(todos.checkbox(title)).toBeChecked();
    });
  });
});
