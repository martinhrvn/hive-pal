# i18n Implementation Todo

## ✅ Completed
- [x] Added i18n dependencies (i18next, react-i18next, i18next-browser-languagedetector, i18next-http-backend)
- [x] Set up i18n configuration and initialization in `/src/lib/i18n.ts`
- [x] Created translation file structure for English (en) and Slovak (sk)
- [x] Created base translation files:
  - `common.json` - Common UI elements and messages
  - `auth.json` - Authentication related strings
  - `hive.json` - Hive management strings

## 🚧 In Progress

## 📋 Todo

### Translation Files
- [ ] Create `inspection.json` for inspection related strings
- [ ] Create `apiary.json` for apiary management
- [ ] Create `queen.json` for queen management
- [ ] Create `admin.json` for admin panel

### Components to Internationalize

#### Authentication Pages
- [ ] Login page (`/src/pages/login-page.tsx`)
- [ ] Register page (`/src/pages/register-page.tsx`)
- [ ] Change password page (`/src/pages/account/change-password-page.tsx`)

#### Main Navigation
- [ ] App sidebar (`/src/components/app-sidebar.tsx`)
- [ ] Navigation components (`nav-main.tsx`, `nav-user.tsx`, `nav-admin.tsx`, `nav-hives.tsx`)

#### Hive Management
- [ ] Hive list page (`/src/pages/hive/hive-list-page.tsx`)
- [ ] Hive detail page (`/src/pages/hive/hive-detail-page/page.tsx`)
- [ ] Create hive page (`/src/pages/hive/create-hive-page.tsx`)
- [ ] Hive form component (`/src/pages/hive/components/hive-form.tsx`)

#### Inspection Management
- [ ] Inspection list (`/src/pages/inspection/inspection-list-page.tsx`)
- [ ] Inspection detail (`/src/pages/inspection/inspection-detail-page.tsx`)
- [ ] Create inspection (`/src/pages/inspection/create-inspection.tsx`)
- [ ] Inspection form (`/src/pages/inspection/components/inspection-form/`)

#### Apiary Management
- [ ] Apiary list (`/src/pages/apiaries/apiary-list-page.tsx`)
- [ ] Apiary detail (`/src/pages/apiaries/apiary-detail-page.tsx`)
- [ ] Create apiary (`/src/pages/apiaries/create-apiary-page.tsx`)

#### Admin Panel
- [ ] User management (`/src/pages/admin/user-management/user-management-page.tsx`)

#### Common Components
- [ ] Error messages and alerts
- [ ] Form validation messages
- [ ] Loading states
- [ ] Confirmation dialogs

### Features to Add
- [ ] Language switcher component
- [ ] Persist language preference in localStorage
- [ ] Date formatting with i18n
- [ ] Number formatting with i18n
- [ ] Add language switcher to user menu

### Testing
- [ ] Test language switching
- [ ] Verify all strings are translated
- [ ] Check for missing translations
- [ ] Test RTL support (if needed)

## 📝 Notes

### Usage Examples

```tsx
// Import useTranslation hook
import { useTranslation } from 'react-i18next';

// In component
const { t } = useTranslation('common');

// Use translation
<Button>{t('actions.save')}</Button>

// With namespace
const { t } = useTranslation(['hive', 'common']);
<h1>{t('hive:title')}</h1>

// With interpolation
t('welcome', { name: 'John' })
```

### File Structure
```
public/
  locales/
    en/
      common.json
      auth.json
      hive.json
      inspection.json
      apiary.json
      queen.json
      admin.json
    sk/
      (same structure as en)
```

### Adding New Language
1. Create new folder in `public/locales/` with language code
2. Copy all JSON files from `en` folder
3. Translate all strings
4. Add language option to language switcher component