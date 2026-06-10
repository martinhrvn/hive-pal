import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Bell,
  Palette,
  User,
  Save,
  Loader2,
  Database,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePreferences } from '@/api/hooks/useUserPreferences';
import { useDeleteAccount } from '@/api/hooks/useDeleteAccount';
import { useTheme } from '@/context/use-theme';
import { useAuth } from '@/context/auth-context/use-auth';
import { UserPreferences } from 'shared-schemas';
import { normalizeLanguageCode } from '@/utils/language-utils';
import { LanguageSwitcher } from '@/components/language-switcher';
import { PasskeysCard } from '@/components/passkeys-card';
import { DeleteAccountDialog } from '@/components/common/delete-account-dialog';

export const UserSettingsPage = () => {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const { preferences, updatePreferences } = usePreferences();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const deleteAccount = useDeleteAccount();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount.mutateAsync();
      toast.success(
        t('settings.accountDeleted', {
          defaultValue: 'Your account has been deleted.',
        }),
      );
      try {
        await logout();
      } catch {
        // Session is already gone server-side; ensure we still leave the app.
        window.location.href = '/login';
      }
    } catch {
      toast.error(
        t('settings.deleteAccountFailed', {
          defaultValue: 'Failed to delete account. Please try again.',
        }),
      );
    }
  };

  const [settings, setSettings] = useState<Omit<UserPreferences, 'theme'>>({
    language: normalizeLanguageCode(i18n.language || 'en'),
    dateFormat: 'MM/DD/YYYY',
    units: 'metric',
    emailNotifications: true,
    pushNotifications: false,
    inspectionReminders: true,
    harvestReminders: true,
  });

  // Load preferences from API when available
  useEffect(() => {
    if (preferences.data) {
      setSettings({
        language: normalizeLanguageCode(
          preferences.data.language || i18n.language || 'en',
        ),
        dateFormat: preferences.data.dateFormat || 'MM/DD/YYYY',
        units: preferences.data.units || 'metric',
        emailNotifications: preferences.data.emailNotifications ?? true,
        pushNotifications: preferences.data.pushNotifications ?? false,
        inspectionReminders: preferences.data.inspectionReminders ?? true,
        harvestReminders: preferences.data.harvestReminders ?? true,
      });
    }
  }, [preferences.data, i18n.language]);

  const handleSaveSettings = async () => {
    try {
      // Include theme from context with other settings
      await updatePreferences.mutateAsync({
        ...settings,
        theme,
      });
      toast.success(t('messages.changesSaved'), {
        description: t('settings.preferencesUpdated'),
      });
    } catch {
      toast.error(t('messages.errorOccurred'), {
        description: t('settings.failedToSavePreferences'),
      });
    }
  };

  const handleLanguageChange = (value: string) => {
    setSettings({ ...settings, language: normalizeLanguageCode(value) });
  };

  // Show loading state while fetching preferences
  if (preferences.isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t('navigation.settings')}</h1>
          <p className="text-muted-foreground">
            {t('settings.managePreferences')}
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('navigation.settings')}</h1>
        <p className="text-muted-foreground">
          {t('settings.managePreferences')}
        </p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('settings.generalSettings')}
            </CardTitle>
            <CardDescription>
              {t('settings.configureLanguageRegional')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">{t('actions.language')}</Label>
                <LanguageSwitcher
                  variant="select"
                  onLanguageChange={handleLanguageChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFormat">{t('settings.dateFormat')}</Label>
                <Select
                  value={settings.dateFormat}
                  onValueChange={(value: string) =>
                    setSettings({
                      ...settings,
                      dateFormat: value as UserPreferences['dateFormat'],
                    })
                  }
                >
                  <SelectTrigger id="dateFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="units">{t('settings.unitsOfMeasurement')}</Label>
              <Select
                value={settings.units}
                onValueChange={(value: 'metric' | 'imperial') =>
                  setSettings({ ...settings, units: value })
                }
              >
                <SelectTrigger id="units">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">{t('settings.metric')}</SelectItem>
                  <SelectItem value="imperial">
                    {t('settings.imperial')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Display Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t('settings.displayPreferences')}
            </CardTitle>
            <CardDescription>
              {t('settings.customizeAppearance')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">{t('settings.theme')}</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t('settings.light')}</SelectItem>
                  <SelectItem value="dark">{t('settings.dark')}</SelectItem>
                  <SelectItem value="system">{t('settings.system')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('settings.notificationPreferences')}
            </CardTitle>
            <CardDescription>
              {t('settings.chooseNotificationMethod')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">
                  {t('settings.emailNotifications')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.receiveEmailUpdates')}
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={checked =>
                  setSettings({ ...settings, emailNotifications: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">
                  {t('settings.pushNotifications')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.receiveBrowserNotifications')}
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.pushNotifications}
                onCheckedChange={checked =>
                  setSettings({ ...settings, pushNotifications: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inspection-reminders">
                  {t('settings.inspectionReminders')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.upcomingInspectionsNotify')}
                </p>
              </div>
              <Switch
                id="inspection-reminders"
                checked={settings.inspectionReminders}
                onCheckedChange={checked =>
                  setSettings({ ...settings, inspectionReminders: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="harvest-reminders">
                  {t('settings.harvestReminders')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.harvestSchedulesNotify')}
                </p>
              </div>
              <Switch
                id="harvest-reminders"
                checked={settings.harvestReminders}
                onCheckedChange={checked =>
                  setSettings({ ...settings, harvestReminders: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('settings.accountSettings')}
            </CardTitle>
            <CardDescription>{t('settings.manageAccountInfo')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{t('settings.password')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('settings.changePassword')}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/account/change-password')}
              >
                {t('settings.changePassword')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Passkeys */}
        <PasskeysCard />

        {/* Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data
            </CardTitle>
            <CardDescription>
              Export your account data for backup, or import from a previous
              export.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Export and import</p>
                <p className="text-sm text-muted-foreground">
                  Migrate between instances or keep your own backups.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/settings/data-transfer')}
              >
                Open
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveSettings}
            size="lg"
            className="gap-2"
            disabled={updatePreferences.isPending || preferences.isLoading}
          >
            {updatePreferences.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {updatePreferences.isPending
              ? t('settings.saving')
              : t('settings.saveSettings')}
          </Button>
        </div>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              {t('settings.dangerZone', { defaultValue: 'Danger Zone' })}
            </CardTitle>
            <CardDescription>
              {t('settings.dangerZoneDescription', {
                defaultValue: 'Irreversible actions for your account.',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">
                  {t('settings.deleteAccount', {
                    defaultValue: 'Delete account',
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('settings.deleteAccountDescription', {
                    defaultValue:
                      'Permanently delete your account and all your apiaries, hives, inspections, photos, and other data. This cannot be undone. Export your data first if you want to keep a copy.',
                  })}
                </p>
              </div>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                {t('settings.deleteAccount', {
                  defaultValue: 'Delete account',
                })}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={open => !deleteAccount.isPending && setDeleteOpen(open)}
        onConfirm={handleDeleteAccount}
        isPending={deleteAccount.isPending}
        email={user?.email ?? ''}
      />
    </div>
  );
};
