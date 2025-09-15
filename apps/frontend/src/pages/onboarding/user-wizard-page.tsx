import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';
import {
  ApiaryForm,
  ApiaryFormData,
} from '@/pages/apiaries/components/apiary-form';
import { HiveForm, HiveFormData } from '@/pages/hive/components/hive-form';
import { ApiaryResponse, HiveStatus } from 'shared-schemas';

// Import CheckIcon for success step
import { CheckIcon } from 'lucide-react';
import { useCreateApiary, useCreateHive } from '@/api/hooks';

export const UserWizardPage = () => {
  const [step, setStep] = useState(0);
  const [apiary, setApiary] = useState<ApiaryResponse | null>(null);
  const { t } = useTranslation('onboarding');

  const steps = [
    t('steps.welcome'),
    t('steps.createApiary'),
    t('steps.addHive'),
    t('steps.complete')
  ];

  const apiaryMutation = useCreateApiary();
  const hiveMutation = useCreateHive();

  const handleApiarySubmit = async (data: ApiaryFormData) => {
    try {
      const result = await apiaryMutation.mutateAsync({ ...data });
      setApiary(result);
      setStep(2);
    } catch (error) {
      console.error('Error creating apiary:', error);
    }
  };

  const handleHiveSubmit = async (data: HiveFormData) => {
    if (!apiary) return;

    try {
      await hiveMutation.mutateAsync({
        ...data,
        status: data.status as HiveStatus,
        installationDate: data.installationDate.toISOString(),
        apiaryId: apiary.id,
      });
      setStep(3);
    } catch (error) {
      console.error('Error creating hive:', error);
    }
  };

  const handleStart = () => {
    setStep(1);
  };

  const handleFinish = () => {
    window.location.href = '/';
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 mt-10 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <CardDescription>
            {t('subtitle')}
          </CardDescription>
          <div className="mt-6">
            <Stepper steps={steps} currentStep={step} />
          </div>
        </CardHeader>

        <CardContent>
          {step === 0 && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-6">
                <img
                  src="/hive-pal-logo.png"
                  className="w-24"
                  alt="Hive-Pal Logo"
                />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                {t('welcome.title')}
              </h3>
              <p className="mb-6 text-muted-foreground max-w-lg mx-auto">
                {t('welcome.description')}
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="py-4">
              <h3 className="text-xl font-semibold mb-4">
                {t('apiary.title')}
              </h3>
              <p className="mb-6 text-muted-foreground">
                {t('apiary.description')}
              </p>
              <ApiaryForm
                onSubmit={handleApiarySubmit}
                isLoading={apiaryMutation.isPending}
              />
            </div>
          )}

          {step === 2 && apiary && (
            <div className="py-4">
              <h3 className="text-xl font-semibold mb-4">
                {t('hive.title')}
              </h3>
              <p className="mb-6 text-muted-foreground">
                {t('hive.description', { apiaryName: apiary.name })}
              </p>
              <HiveForm
                onSubmit={handleHiveSubmit}
                isLoading={hiveMutation.isPending}
              />
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-6">
                <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckIcon className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-4">{t('complete.title')}</h3>
              <p className="mb-6 text-muted-foreground max-w-lg mx-auto">
                {t('complete.description')}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {step === 0 && (
            <div className="w-full">
              <Button 
                onClick={handleStart} 
                className="w-full"
                data-umami-event="Onboarding Start"
              >
                {t('welcome.action')}
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="w-full">
              <Button 
                onClick={handleFinish} 
                className="w-full"
                data-umami-event="Onboarding Complete"
              >
                {t('complete.action')}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
