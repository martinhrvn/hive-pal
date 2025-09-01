import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Globe, Bell, Palette, User, Save } from 'lucide-react';
import { toast } from 'sonner';

export const UserSettingsPage = () => {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState({
    language: i18n.language || 'en',
    theme: 'light',
    dateFormat: 'MM/DD/YYYY',
    units: 'metric',
    emailNotifications: true,
    pushNotifications: false,
    inspectionReminders: true,
    harvestReminders: true,
  });

  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
  });

  const handleSaveSettings = () => {
    toast.success(t('messages.changesSaved'), {
      description: t('settings.preferencesUpdated'),
    });
  };

  const handleLanguageChange = (value: string) => {
    setSettings({ ...settings, language: value });
    i18n.changeLanguage(value);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('navigation.settings')}</h1>
        <p className="text-muted-foreground">{t('settings.managePreferences')}</p>
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
                <Select value={settings.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateFormat">{t('settings.dateFormat')}</Label>
                <Select value={settings.dateFormat} onValueChange={(value) => setSettings({ ...settings, dateFormat: value })}>
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
              <Select value={settings.units} onValueChange={(value) => setSettings({ ...settings, units: value })}>
                <SelectTrigger id="units">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">{t('settings.metric')}</SelectItem>
                  <SelectItem value="imperial">{t('settings.imperial')}</SelectItem>
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
              <Select value={settings.theme} onValueChange={(value) => setSettings({ ...settings, theme: value })}>
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
                <Label htmlFor="email-notifications">{t('settings.emailNotifications')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.receiveEmailUpdates')}</p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">{t('settings.pushNotifications')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.receiveBrowserNotifications')}</p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inspection-reminders">{t('settings.inspectionReminders')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.upcomingInspectionsNotify')}</p>
              </div>
              <Switch
                id="inspection-reminders"
                checked={settings.inspectionReminders}
                onCheckedChange={(checked) => setSettings({ ...settings, inspectionReminders: checked })}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="harvest-reminders">{t('settings.harvestReminders')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.harvestSchedulesNotify')}</p>
              </div>
              <Switch
                id="harvest-reminders"
                checked={settings.harvestReminders}
                onCheckedChange={(checked) => setSettings({ ...settings, harvestReminders: checked })}
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
            <CardDescription>
              {t('settings.manageAccountInfo')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('settings.name')}</Label>
                <Input
                  id="name"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  placeholder={t('settings.enterName')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">{t('settings.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                  placeholder={t('settings.enterEmail')}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{t('settings.password')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.changePassword')}</p>
              </div>
              <Button variant="outline" onClick={() => navigate('/account/change-password')}>
                {t('settings.changePassword')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} size="lg" className="gap-2">
            <Save className="h-4 w-4" />
            {t('settings.saveSettings')}
          </Button>
        </div>
      </div>
    </div>
  );
};