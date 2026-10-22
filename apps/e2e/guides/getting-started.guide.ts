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
    await g.intro('Getting started', 'From sign-up to your first dashboard', {
      voiceover:
        'Welcome to Hive Pal. In this guide, we’ll go from a brand new account to a dashboard with your apiary, your hives, and the local weather.',
    });
    await g.do(
      'Click “Start free” to create an account',
      () => landing.startSignUp(),
      {
        target: landing.startFreeButton,
        voiceover:
          'It all starts on the home page. Click Start free to create your account.',
      },
    );
    await g.do(
      'Enter your name, email and a password',
      () =>
        signup.fillDetails(
          // Typed on screen, so shorter than smokeEmail(); same smoke+ pattern.
          `smoke+${randomString(6).toLowerCase()}@e2e.hivepal.test`,
          smokePassword(),
          'Demo Beekeeper',
        ),
      {
        voiceover:
          'Fill in your name, your email address, and a password you’ll remember.',
      },
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
      {
        target: signup.signUpButton,
        voiceover:
          'Accept the privacy policy, and create the account. That’s it, you’re in.',
      },
    );

    // -- Your apiary -----------------------------------------------------------
    await switcher.expectActive('My Apiary');
    await g.chapter(
      'Your apiary',
      'Everything in Hive Pal lives in an apiary',
      {
        voiceover:
          'First, a word about apiaries. Everything in Hive Pal lives in one.',
      },
    );
    await g.point(
      switcher.trigger,
      'Everything you see belongs to the apiary picked here',
      {
        voiceover:
          'Up here is the apiary you’re working in. Hives, inspections, and harvests all belong to the apiary picked here.',
      },
    );
    await g.do(
      'Open it to switch apiaries or add another',
      () => switcher.trigger.click(),
      {
        voiceover:
          'Open it, and you can switch to another apiary, or add a new one.',
      },
    );
    await g.point(
      switcher.allApiariesItem,
      'or look at all your apiaries at once',
      {
        voiceover:
          'And if you keep bees in more than one place, you can look at all of them at once.',
      },
    );
    await page.keyboard.press('Escape');
    await expect(dashboard.locationNudge).toBeVisible();
    await g.point(
      dashboard.locationNudge,
      'Hive Pal made one for you. Add a location to get weather',
      {
        voiceover:
          'You don’t have to set anything up to get going. Hive Pal already made an apiary for you. It just needs a location, so it can show your weather.',
      },
    );

    // -- Update the apiary -----------------------------------------------------
    await g.do(
      'Click “Add location”',
      () => dashboard.addLocationLink.click(),
      {
        target: dashboard.addLocationLink,
        voiceover: 'So let’s click Add location.',
      },
    );
    await expect(apiaryForm.nameInput).toHaveValue('My Apiary');
    const apiaryId = /\/apiaries\/([^/]+)\/edit/.exec(page.url())![1];
    await g.do(
      'Give it a name',
      () => apiaryForm.nameInput.fill(DEMO_APIARY_NAME),
      { voiceover: 'Give your apiary a proper name,' },
    );
    await g.do(
      'Describe where it is',
      () => apiaryForm.locationInput.fill('Behind the orchard'),
      { voiceover: 'and a few words about where it is.' },
    );
    await g.do('Click the map to drop a pin', () => apiaryForm.dropPin(), {
      target: apiaryForm.mapContainer,
      voiceover: 'Then click on the map, to drop a pin where your hives stand.',
    });
    await g.point(
      apiaryForm.mapContainer,
      'The pin is how Hive Pal knows your local weather',
      {
        voiceover: 'That pin is how Hive Pal knows which weather is yours.',
      },
    );
    await g.say('Weather updates run every few hours, so give it a moment', {
      voiceover:
        'The weather is refreshed every few hours, so the first forecast can take a little while to show up.',
    });
    await g.point(
      apiaryForm.inspectionTypeSelect,
      'Pick how detailed your inspections should be',
      {
        voiceover:
          'Down here, you can pick how detailed your inspections should be. Quick and simple, or more thorough.',
      },
    );
    // From here on the apiary has a location; serve its first forecast.
    await mockWeather(page, apiaryId);
    await g.do('Save', () => apiaryForm.submitForm(), {
      target: apiaryForm.submitButton,
      voiceover: 'Save, and your apiary is ready.',
    });
    await page.waitForURL(`**/apiaries/${apiaryId}`);
    await switcher.expectActive(DEMO_APIARY_NAME);

    // -- Add your hives --------------------------------------------------------
    await g.chapter('Add your hives', undefined, {
      voiceover: 'Next, let’s add your hives.',
    });
    await dashboard.openFromSidebar();
    const newHive = dashboard.createNewGroup.getByRole('link', {
      name: 'New Hive',
    });
    await expect(dashboard.noHivesTitle).toBeVisible();
    await g.do(
      'No hives yet. Click “Add your first hive”',
      () => dashboard.addFirstHiveLink.click(),
      {
        target: dashboard.addFirstHiveLink,
        voiceover: 'There are no hives yet, so click Add your first hive.',
      },
    );
    const [firstHive, ...otherHives] = DEMO_HIVES;
    await g.do('Name it', () => hiveForm.nameInput.fill(firstHive), {
      voiceover:
        'Give it a name. Whatever you call it in the field works best.',
    });
    await expect(hiveForm.apiarySelect).toContainText(DEMO_APIARY_NAME);
    await g.point(hiveForm.apiarySelect, 'It goes to the apiary you’re in', {
      voiceover:
        'It goes to the apiary you’re in, so there’s nothing to change here.',
    });
    await g.do(
      'Set when it was installed',
      () => hiveForm.ensureInstallationDate(),
      {
        target: hiveForm.installationDateButton,
        voiceover: 'Set the date the colony was installed,',
      },
    );
    await g.do('Save', () => hiveForm.submitForm(), {
      target: hiveForm.submitButton,
      voiceover: 'and save.',
    });
    await expect(dashboard.hive(firstHive)).toBeVisible();
    await g.point(newHive, 'More hives? “New Hive” is always here', {
      voiceover:
        'Your first hive is on the dashboard. For the next ones, New Hive is always right here.',
    });
    await g.do(
      'Add the others the same way',
      async () => {
        for (const name of otherHives) {
          await newHive.click();
          await hiveForm.createHive({ name });
          await expect(dashboard.hive(name)).toBeVisible();
        }
      },
      {
        voiceover: 'Let’s add the rest of the hives the same way.',
      },
    );

    // -- Arrange them on the layout --------------------------------------------
    await g.chapter(
      'Arrange your apiary',
      'A minimap of where your hives stand',
      {
        voiceover:
          'Now, let’s arrange your apiary, so Hive Pal knows where each hive stands.',
      },
    );
    await expect(dashboard.hiveLayoutEmpty).toBeVisible();
    await g.point(
      dashboard.hiveLayout,
      'This minimap shows where your hives stand. It’s empty for now',
      {
        voiceover:
          'This minimap on the dashboard shows your hives the way they stand. Right now, it’s empty.',
      },
    );
    await g.do('Click “Edit layout”', () => dashboard.editLayoutLink.click(), {
      target: dashboard.editLayoutLink,
      voiceover: 'Click Edit layout to fill it in.',
    });
    await expect(layout.unpositionedCard).toBeVisible();
    await g.point(layout.unpositionedCard, 'New hives wait down here', {
      voiceover: 'Hives that aren’t placed yet wait down here.',
    });
    await g.do(
      'Drag each hive onto the grid, the way they stand',
      async () => {
        for (const [col, name] of DEMO_HIVES.entries()) {
          await layout.placeHive(name, 0, col);
        }
      },
      {
        target: layout.unpositionedCard,
        voiceover:
          'Drag each one onto the grid, in the same order they stand in your apiary.',
      },
    );
    await expect(layout.unpositionedCard).toBeHidden();
    await g.do('Back to the dashboard', () => dashboard.openFromSidebar(), {
      target: dashboard.homeLink,
      voiceover: 'Now, back to the dashboard.',
    });
    for (const name of DEMO_HIVES) {
      await expect(dashboard.layoutHive(name)).toBeVisible();
    }
    await g.point(dashboard.hiveLayout, 'Now the minimap matches your apiary', {
      voiceover: 'And there they are. The minimap now matches your apiary.',
    });

    // -- Settings --------------------------------------------------------------
    await g.chapter('Make it yours', undefined, {
      voiceover: 'Before we finish, let’s make Hive Pal yours.',
    });
    await g.do('Settings are in the sidebar', () => sidebar.open('Settings'), {
      target: sidebar.nav('Settings'),
      voiceover: 'Your settings are in the sidebar.',
    });
    await expect(settings.heading).toBeVisible();
    await g.tour([
      [
        settings.unitsSelect,
        'Metric or imperial: weights and temperatures follow',
        {
          voiceover:
            'Choose metric or imperial units. Weights and temperatures follow your choice everywhere.',
        },
      ],
      [
        settings.dateFormatSelect,
        'How dates are written, and the first day of the week',
        {
          voiceover:
            'Here you set how dates are written, and which day your week starts on.',
        },
      ],
    ]);
    await g.do(
      'Hive Pal speaks several languages',
      () => settings.openLanguages(),
      {
        target: settings.languageSelect,
        voiceover: 'Hive Pal also speaks several languages.',
      },
    );
    await expect(settings.languageOption('Slovenčina')).toBeVisible();
    await g.point(
      page.getByRole('listbox'),
      'Pick yours. The whole app switches straight away',
      {
        voiceover: 'Pick yours, and the whole app switches straight away.',
      },
    );
    await page.keyboard.press('Escape');

    // -- Your dashboard --------------------------------------------------------
    await g.chapter('Your dashboard', 'A quick look around', {
      voiceover: 'Finally, let’s take a quick look around your dashboard.',
    });
    await g.do('Back to the dashboard', () => dashboard.openFromSidebar(), {
      target: dashboard.homeLink,
      voiceover: 'Back on the dashboard,',
    });
    await expect(dashboard.weather).toContainText(`${MOCK_TEMPERATURE_C}°`);
    await g.tour([
      [
        dashboard.hiveLayout,
        'Your apiary at a glance. Click a hive to open it',
        {
          voiceover:
            'the minimap gives you your apiary at a glance. Click any hive to open it.',
        },
      ],
      [
        dashboard.quickAddButton,
        'Log an inspection, action, photo or note',
        {
          voiceover:
            'Quick add lets you log an inspection, an action, a photo, or a note in a few taps.',
        },
      ],
      [
        dashboard.weather,
        'Local weather for your apiary, refreshed every few hours',
        {
          voiceover:
            'Here’s the local weather for your apiary, the one we set up with the pin.',
        },
      ],
      [
        dashboard.calendar,
        'Upcoming inspections and past work by day',
        {
          voiceover:
            'The calendar shows upcoming inspections, and the work you’ve already done, day by day.',
        },
      ],
      [
        dashboard.createNewGroup,
        'Shortcuts to add hives, inspections and queens',
        {
          voiceover: 'These shortcuts add hives, inspections, and queens.',
        },
      ],
      [
        sidebar.root,
        'Everything else lives in the sidebar',
        {
          voiceover:
            'And everything else, from harvests to reports, lives in the sidebar.',
        },
      ],
    ]);
    await g.do('The + button is on every page', () => dashboard.fab.open(), {
      target: dashboard.fab.toggle,
      voiceover: 'One last thing. This plus button is on every page.',
    });
    await expect(dashboard.fab.action('Add Inspection')).toBeVisible();
    await g.point(
      dashboard.fab.actions,
      'Inspect, schedule, log actions or scan a hive’s QR code',
      {
        voiceover:
          'From anywhere in the app, you can start an inspection, schedule one, log an action, or scan a hive’s QR code.',
      },
    );
    await dashboard.fab.close();
    await g.say('You’re all set. The next guides go into each part in detail', {
      voiceover:
        'And that’s it, you’re all set. The next guides go into each part in more detail. Happy beekeeping!',
    });
  });
});
