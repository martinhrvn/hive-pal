import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const REDIRECT_SECONDS = 3;

export const EquipmentSettingsPage = () => {
  const { t } = useTranslation('hive');
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect after REDIRECT_SECONDS
    const timer = setTimeout(() => {
      navigate('/equipment');
    }, REDIRECT_SECONDS * 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Settings className="h-6 w-6" />
            {t('hive:equipment.equipmentSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {t('hive:equipment.settingsMoved.simplified')}
          </p>
          <p>{t('hive:equipment.settingsMoved.manageFromPlanning')}</p>
          <div className="pt-4">
            <Button onClick={() => navigate('/equipment')} className="w-full">
              {t('hive:equipment.settingsMoved.goToPlanning')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('hive:equipment.settingsMoved.redirecting', {
              count: REDIRECT_SECONDS,
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
