# @hive-pal/page-objects

Shared page objects for component and E2E tests in Hive-Pal.

## Usage

```typescript
// In your test file
import { LoginPage, SignupPage, ActionsSectionPageObject } from '@hive-pal/page-objects';

// Create a new page object
const loginPage = new LoginPage(page);

// Use the page object methods
await loginPage.logIn('user@example.com', 'password');

// Or use inspection page objects
const actionsSection = new ActionsSectionPageObject(page);
await actionsSection.selectAction('Feeding');
```

## Available Page Objects

- `auth` - Authentication-related page objects
  - `LoginPage` - Page object for login functionality
  - `SignupPage` - Page object for registration functionality

- `inspection` - Inspection-related page objects
  - `ActionsSectionPageObject` - Page object for managing inspection actions
  - `FeedingsSectionPageObject` - Page object for feeding actions
  - `TreatmentSectionPageObject` - Page object for treatment actions
  - `FramesSectionPageObject` - Page object for frame actions

- `utils` - Utility helpers
  - `TEST_SELECTORS` - Common test selectors used across page objects

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Watch for changes
pnpm dev
```