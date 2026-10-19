import { Locator, Page } from '@playwright/test';
import { AppSidebar } from '../shell/app-sidebar.page';
import { FloatingActionButton } from './floating-action-button.page';

/** `/` — the home dashboard for the active apiary. */
export class DashboardPage {
  readonly page: Page;
  /** Title of the "No hives yet" empty-state card (`onboarding:empty.noHives.title`). */
  readonly noHivesTitle: Locator;
  /** "Add your first hive" link of the empty state, pointing to `/hives/create`. */
  readonly addFirstHiveLink: Locator;
  /** The "Add a location for weather" nudge, shown until the apiary has coordinates. */
  readonly locationNudge: Locator;
  /** "Add location" link of that nudge, pointing to the apiary edit page. */
  readonly addLocationLink: Locator;
  /** The "Hive Layout" section: a read-only minimap of the apiary's hive grid. */
  readonly hiveLayout: Locator;
  /** Shown in the minimap while no hive is placed on the grid. */
  readonly hiveLayoutEmpty: Locator;
  /** "Edit layout" link in the minimap header, to the apiary's Hives tab. */
  readonly editLayoutLink: Locator;
  /** "Add Entry" menu in the Recent Activity header (quick check, inspection, action, …). */
  readonly quickAddButton: Locator;
  /** Calendar card at the top of the right-hand action sidebar. */
  readonly calendar: Locator;
  /** Weather card in the action sidebar. */
  readonly weather: Locator;
  /** "Create New" shortcuts in the action sidebar (new hive, inspection, queen…). */
  readonly createNewGroup: Locator;
  /** "Dashboard" at the top of the sidebar navigation. */
  readonly homeLink: Locator;
  readonly fab: FloatingActionButton;

  constructor(page: Page) {
    this.page = page;
    this.noHivesTitle = page.getByText('No hives yet');
    this.addFirstHiveLink = page.getByRole('link', {
      name: 'Add your first hive',
    });
    this.locationNudge = page
      .getByRole('heading', { name: 'Add a location for weather' })
      .locator('xpath=ancestor::*[@data-slot="card"][1]');
    this.addLocationLink = page.getByRole('link', { name: 'Add location' });
    this.hiveLayout = page.getByRole('region', { name: 'Hive Layout' });
    this.hiveLayoutEmpty = this.hiveLayout.getByText(
      'No hives are placed on the layout yet',
    );
    this.editLayoutLink = this.hiveLayout.getByRole('link', {
      name: 'Edit layout',
    });
    this.quickAddButton = page.getByRole('button', { name: 'Add Entry' });
    this.calendar = sidebarGroup(page, 'Calendar');
    this.weather = page
      .getByRole('heading', { name: 'Weather Forecast' })
      .locator('..');
    this.createNewGroup = sidebarGroup(page, 'Create New');
    this.fab = new FloatingActionButton(page);
    this.homeLink = new AppSidebar(page).nav('Dashboard');
  }

  async goto() {
    await this.page.goto('/');
  }

  /**
   * Back to the dashboard through the sidebar. Waits for the dashboard itself
   * (not just the URL): until it replaces the skeleton, the previous page's
   * action sidebar can still be on screen.
   */
  async openFromSidebar() {
    await this.homeLink.click();
    await this.page.waitForURL(url => url.pathname === '/');
    await this.hiveLayout.waitFor();
  }

  /** A hive entry in the "Hives" section (rendered as a clickable card). */
  hive(name: string): Locator {
    return this.page.getByText(name, { exact: true }).first();
  }

  async openHive(name: string) {
    await this.hive(name).click();
  }

  /** A hive placed on the minimap (a link to the hive, titled with its name). */
  layoutHive(name: string): Locator {
    return this.hiveLayout.getByTitle(name, { exact: true });
  }
}

/** A titled group (`<section>` with an `<h3>`) in the right-hand action sidebar. */
function sidebarGroup(page: Page, title: string): Locator {
  return page.locator('section').filter({
    has: page.getByRole('heading', { name: title, exact: true, level: 3 }),
  });
}
