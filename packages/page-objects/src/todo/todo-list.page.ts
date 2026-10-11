import { Locator, Page } from '@playwright/test';

/** The `/todos` page: quick-add input, "Show completed" switch and the todo list. */
export class TodoListPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly quickAddInput: Locator;
  readonly quickAddButton: Locator;
  readonly showCompletedSwitch: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Todos' });
    this.quickAddInput = page.getByRole('textbox', { name: 'Add a todo…' });
    this.quickAddButton = page.getByRole('button', {
      name: 'Add',
      exact: true,
    });
    this.showCompletedSwitch = page.getByRole('switch', {
      name: 'Show completed',
    });
  }

  async goto() {
    await this.page.goto('/todos');
  }

  /** Add a todo through the quick-add box and wait for the API call. */
  async quickAdd(title: string) {
    await this.quickAddInput.fill(title);
    const created = this.page.waitForResponse(
      res =>
        res.url().includes('/api/todos') && res.request().method() === 'POST',
    );
    await this.quickAddButton.click();
    await created;
  }

  /** The list row of the todo with the given title. */
  item(title: string): Locator {
    return this.page.getByRole('listitem').filter({ hasText: title });
  }

  /** The completion checkbox of the todo with the given title. */
  checkbox(title: string): Locator {
    return this.item(title).getByRole('checkbox', { name: 'Toggle complete' });
  }

  async toggleComplete(title: string) {
    const updated = this.page.waitForResponse(
      res =>
        res.url().includes('/api/todos/') && res.request().method() === 'PATCH',
    );
    await this.checkbox(title).click();
    await updated;
  }

  async showCompleted(show: boolean) {
    const isOn =
      (await this.showCompletedSwitch.getAttribute('aria-checked')) === 'true';
    if (isOn !== show) await this.showCompletedSwitch.click();
  }
}
