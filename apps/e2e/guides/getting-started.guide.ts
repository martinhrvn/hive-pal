import {
  ApiaryFormPage,
  ApiarySwitcher,
  AppSidebar,
  DashboardPage,
  HiveFormPage,
  HiveLayoutEditor,
  LandingPage,
  SignupPage,
  UserSettingsPage,
} from 'page-objects';
import { randomString, smokePassword } from '../tests/smoke/fixtures';
import { DEMO_APIARY_NAME, DEMO_HIVES, expect, test } from './guide.fixture';
import {
  MOCK_TEMPERATURE_C,
  mockWeather,
  allowStoredWeather,
} from './weather-mock';

// Somewhere believable for the map to centre on (map.locate()).
test.use({
  geolocation: { latitude: 48.15, longitude: 17.11 },
  permissions: ['geolocation'],
});

test.describe('Guides', { tag: ['@guide'] }, () => {
  test('Getting started', async ({ page, g }, testInfo) => {
    // Arranging hives is native drag and drop, which needs a mouse.
    test.skip(
      testInfo.project.name === 'guides-mobile',
      'hive layout drag and drop is desktop only',
    );

    const landing = new LandingPage(page);
    const signup = new SignupPage(page);
    const dashboard = new DashboardPage(page);
    const switcher = new ApiarySwitcher(page);
    const apiaryForm = new ApiaryFormPage(page);
    const hiveForm = new HiveFormPage(page);
    const layout = new HiveLayoutEditor(page);
    const settings = new UserSettingsPage(page);
    const sidebar = new AppSidebar(page);

    await allowStoredWeather(page);
    await landing.goto();
    await expect(landing.startFreeButton).toBeVisible();

    // -- Create your account ---------------------------------------------------
    await g.intro('Getting started', 'From sign-up to your first dashboard');
    await g.do(
      'Click “Start free” to create an account',
      () => landing.startSignUp(),
      { target: landing.startFreeButton },
    );
    await g.do('Enter your name, email and a password', () =>
      signup.fillDetails(
        // Typed on screen, so shorter than smokeEmail(); same smoke+ pattern.
        `smoke+${randomString(6).toLowerCase()}@e2e.hivepal.test`,
        smokePassword(),
        'Demo Beekeeper',
      ),
    );
    await g.do(
      'Accept the privacy policy and create your account',
      async () => {
        await signup.acceptAndSubmit();
        // Registration reloads the page; wait for the URL, not the DOM.
        await page.waitForURL(url => url.pathname === '/', {
          timeout: 20_000,
        });
      },
      { target: signup.signUpButton },
    );

    // -- Your apiary -----------------------------------------------------------
    await switcher.expectActive('My Apiary');
    await g.chapter('Your apiary', 'Everything in Hive Pal lives in an apiary');
    await g.point(
      switcher.trigger,
      'Everything you see belongs to the apiary picked here',
    );
    await g.do('Open it to switch apiaries or add another', () =>
      switcher.trigger.click(),
    );
    await g.point(
      switcher.allApiariesItem,
      'or look at all your apiaries at once',
    );
    await page.keyboard.press('Escape');
    await expect(dashboard.locationNudge).toBeVisible();
    await g.point(
      dashboard.locationNudge,
      'Hive Pal made one for you. Add a location to get weather',
    );

    // -- Update the apiary -----------------------------------------------------
    await g.do(
      'Click “Add location”',
      () => dashboard.addLocationLink.click(),
      {
        target: dashboard.addLocationLink,
      },
    );
    await expect(apiaryForm.nameInput).toHaveValue('My Apiary');
    const apiaryId = /\/apiaries\/([^/]+)\/edit/.exec(page.url())![1];
    await g.do('Give it a name', () =>
      apiaryForm.nameInput.fill(DEMO_APIARY_NAME),
    );
    await g.do('Describe where it is', () =>
      apiaryForm.locationInput.fill('Behind the orchard'),
    );
    await g.do('Click the map to drop a pin', () => apiaryForm.dropPin(), {
      target: apiaryForm.mapContainer,
    });
    await g.point(
      apiaryForm.mapContainer,
      'The pin is how Hive Pal knows your local weather',
    );
    await g.say('Weather updates run every few hours, so give it a moment');
    await g.point(
      apiaryForm.inspectionTypeSelect,
      'Pick how detailed your inspections should be',
    );
    // From here on the apiary has a location; serve its first forecast.
    await mockWeather(page, apiaryId);
    await g.do('Save', () => apiaryForm.submitForm(), {
      target: apiaryForm.submitButton,
    });
    await page.waitForURL(`**/apiaries/${apiaryId}`);
    await switcher.expectActive(DEMO_APIARY_NAME);

    // -- Add your hives --------------------------------------------------------
    await g.chapter('Add your hives');
    await dashboard.openFromSidebar();
    const newHive = dashboard.createNewGroup.getByRole('link', {
      name: 'New Hive',
    });
    await expect(dashboard.noHivesTitle).toBeVisible();
    await g.do(
      'No hives yet. Click “Add your first hive”',
      () => dashboard.addFirstHiveLink.click(),
      { target: dashboard.addFirstHiveLink },
    );
    const [firstHive, ...otherHives] = DEMO_HIVES;
    await g.do('Name it', () => hiveForm.nameInput.fill(firstHive));
    await expect(hiveForm.apiarySelect).toContainText(DEMO_APIARY_NAME);
    await g.point(hiveForm.apiarySelect, 'It goes to the apiary you’re in');
    await g.do(
      'Set when it was installed',
      () => hiveForm.ensureInstallationDate(),
      { target: hiveForm.installationDateButton },
    );
    await g.do('Save', () => hiveForm.submitForm(), {
      target: hiveForm.submitButton,
    });
    await expect(dashboard.hive(firstHive)).toBeVisible();
    await g.point(newHive, 'More hives? “New Hive” is always here');
    await g.do('Add the others the same way', async () => {
      for (const name of otherHives) {
        await newHive.click();
        await hiveForm.createHive({ name });
        await expect(dashboard.hive(name)).toBeVisible();
      }
    });

    // -- Arrange them on the layout --------------------------------------------
    await g.chapter(
      'Arrange your apiary',
      'A minimap of where your hives stand',
    );
    await expect(dashboard.hiveLayoutEmpty).toBeVisible();
    await g.point(
      dashboard.hiveLayout,
      'This minimap shows where your hives stand. It’s empty for now',
    );
    await g.do('Click “Edit layout”', () => dashboard.editLayoutLink.click(), {
      target: dashboard.editLayoutLink,
    });
    await expect(layout.unpositionedCard).toBeVisible();
    await g.point(layout.unpositionedCard, 'New hives wait down here');
    await g.do(
      'Drag each hive onto the grid, the way they stand',
      async () => {
        for (const [col, name] of DEMO_HIVES.entries()) {
          await layout.placeHive(name, 0, col);
        }
      },
      { target: layout.unpositionedCard },
    );
    await expect(layout.unpositionedCard).toBeHidden();
    await g.do('Back to the dashboard', () => dashboard.openFromSidebar(), {
      target: dashboard.homeLink,
    });
    for (const name of DEMO_HIVES) {
      await expect(dashboard.layoutHive(name)).toBeVisible();
    }
    await g.point(dashboard.hiveLayout, 'Now the minimap matches your apiary');

    // -- Settings --------------------------------------------------------------
    await g.chapter('Make it yours');
    await g.do('Settings are in the sidebar', () => sidebar.open('Settings'), {
      target: sidebar.nav('Settings'),
    });
    await expect(settings.heading).toBeVisible();
    await g.tour([
      [
        settings.unitsSelect,
        'Metric or imperial: weights and temperatures follow',
      ],
      [
        settings.dateFormatSelect,
        'How dates are written, and the first day of the week',
      ],
    ]);
    await g.do(
      'Hive Pal speaks several languages',
      () => settings.openLanguages(),
      { target: settings.languageSelect },
    );
    await expect(settings.languageOption('Slovenčina')).toBeVisible();
    await g.point(
      page.getByRole('listbox'),
      'Pick yours. The whole app switches straight away',
    );
    await page.keyboard.press('Escape');

    // -- Your dashboard --------------------------------------------------------
    await g.chapter('Your dashboard', 'A quick look around');
    await g.do('Back to the dashboard', () => dashboard.openFromSidebar(), {
      target: dashboard.homeLink,
    });
    await expect(dashboard.weather).toContainText(`${MOCK_TEMPERATURE_C}°`);
    await g.tour([
      [
        dashboard.hiveLayout,
        'Your apiary at a glance. Click a hive to open it',
      ],
      [dashboard.quickAddButton, 'Log an inspection, action, photo or note'],
      [
        dashboard.weather,
        'Local weather for your apiary, refreshed every few hours',
      ],
      [dashboard.calendar, 'Upcoming inspections and past work by day'],
      [
        dashboard.createNewGroup,
        'Shortcuts to add hives, inspections and queens',
      ],
      [sidebar.root, 'Everything else lives in the sidebar'],
    ]);
    await g.do('The + button is on every page', () => dashboard.fab.open(), {
      target: dashboard.fab.toggle,
    });
    await expect(dashboard.fab.action('Add Inspection')).toBeVisible();
    await g.point(
      dashboard.fab.actions,
      'Inspect, schedule, log actions or scan a hive’s QR code',
    );
    await dashboard.fab.close();
    await g.say('You’re all set. The next guides go into each part in detail');
  });
});
