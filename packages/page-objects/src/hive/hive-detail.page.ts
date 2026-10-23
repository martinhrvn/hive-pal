import { Locator, Page } from '@playwright/test';

/** `/hives/:id` */
export class HiveDetailPage {
  readonly page: Page;
  readonly addInspectionButton: Locator;
  readonly scheduleInspectionButton: Locator;
  readonly addQueenButton: Locator;
  readonly editHiveButton: Locator;
  /** The header card: photo, "Established · …", name, notes, stats. */
  readonly header: Locator;
  readonly statusButton: Locator;
  readonly established: Locator;
  /** "Brood Nest Stats" chips (or score cards) in the header. */
  readonly stats: Locator;
  /** Inline "Year: … Autumn: … %" feeding summary; only after a feeding. */
  readonly feedingSummary: Locator;
  readonly panel: Locator;
  /** Overview tab. */
  readonly todosCard: Locator;
  readonly todoInput: Locator;
  readonly todoAddButton: Locator;
  readonly timeline: Locator;
  readonly addEntryButton: Locator;
  /** Analytics tab: the period select ("Last 6 months"). */
  readonly periodSelect: Locator;
  /** Settings tab. */
  readonly autumnFeedingSettings: Locator;
  readonly inspectionScheduleSettings: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addInspectionButton = page
      .getByRole('button', { name: 'Add Inspection' })
      .first();
    this.scheduleInspectionButton = page
      .getByRole('button', { name: 'Schedule Inspection' })
      .first();
    this.addQueenButton = page
      .getByRole('button', { name: 'Add Queen' })
      .first();
    this.editHiveButton = page
      .getByRole('button', { name: 'Edit Hive' })
      .first();
    this.header = page
      .getByRole('heading', { level: 1 })
      .locator('xpath=ancestor::*[@data-slot="card"][1]');
    this.statusButton = page.getByRole('button', {
      name: 'Change hive status',
    });
    this.established = page.getByText(/^Established · /);
    this.stats = page
      .getByText('Brood Nest Stats', { exact: true })
      .locator('..');
    this.feedingSummary = page
      .getByText('Autumn:', { exact: true })
      .filter({ visible: true })
      .locator('xpath=../..');
    this.panel = page.getByRole('tabpanel');
    this.todosCard = card(page, 'Todos');
    this.todoInput = this.todosCard.getByRole('textbox', {
      name: 'Add a todo…',
    });
    this.todoAddButton = this.todosCard.getByRole('button', {
      name: 'Add',
      exact: true,
    });
    this.timeline = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Activity Timeline' }),
    });
    this.addEntryButton = page.getByRole('button', { name: 'Add Entry' });
    this.periodSelect = this.panel.getByRole('combobox').first();
    this.autumnFeedingSettings = page
      .getByRole('heading', { name: 'Autumn Feeding' })
      .locator('..');
    this.inspectionScheduleSettings = page
      .getByRole('heading', { name: 'Inspection Schedule' })
      .locator('..');
  }

  /** A chart card on the Analytics tab by its title, e.g. "Colony Strength". */
  chart(title: string): Locator {
    return card(this.page, title);
  }

  /** Add a todo for this hive through the Todos card. */
  async addTodo(title: string) {
    await this.todoInput.fill(title);
    const created = this.page.waitForResponse(
      res =>
        res.url().includes('/api/todos') && res.request().method() === 'POST',
    );
    await this.todoAddButton.click();
    await created;
  }

  /** English: Last month, Last 3 months, Last 6 months, Year to date, All time. */
  async selectPeriod(label: string) {
    await this.periodSelect.click();
    await this.page.getByRole('option', { name: label, exact: true }).click();
  }

  heading(name: string): Locator {
    return this.page.getByRole('heading', { level: 1, name });
  }

  /** English tab labels: Overview, Analytics, Boxes, Settings, Queen History. */
  tab(name: string): Locator {
    return this.page.getByRole('tab', { name });
  }

  async goto(hiveId: string) {
    await this.page.goto(`/hives/${hiveId}`);
  }
}

function card(page: Page, title: string): Locator {
  return page.locator('[data-slot="card"]').filter({
    has: page.locator('[data-slot="card-title"]', { hasText: title }),
  });
}
