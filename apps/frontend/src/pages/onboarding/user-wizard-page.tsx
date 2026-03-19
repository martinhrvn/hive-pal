import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stepper } from '@/components/ui/stepper';
import {
  ApiaryForm,
  ApiaryFormData,
} from '@/pages/apiaries/components/apiary-form';
import { HiveForm, HiveFormData } from '@/pages/hive/components/hive-form';
import { ApiaryResponse, HiveStatus } from 'shared-schemas';
import { CheckIcon, Loader2, Building2, Users } from 'lucide-react';
import {
  useApiaries,
  useCreateApiary,
  useCreateHive,
  useHives,
  useLookupApiariesByOwnerEmail,
  useCreateJoinRequest,
  type ApiaryOption,
} from '@/api/hooks';
import { useApiaryStore } from '@/hooks/use-apiary';

type Flow = 'none' | 'create' | 'join';

export const UserWizardPage = () => {
  const [step, setStep] = useState<number | null>(null);
  const [flow, setFlow] = useState<Flow>('none');
  const [apiary, setApiary] = useState<ApiaryResponse | null>(null);
  const { t } = useTranslation('onboarding');
  const { setActiveApiaryId } = useApiaryStore();

  const [ownerEmail, setOwnerEmail] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [selectedApiaryId, setSelectedApiaryId] = useState('');

  const createSteps = [
    t('steps.welcome'),
    t('steps.createApiary'),
    t('steps.addHive'),
    t('steps.complete'),
  ];
  const joinSteps = [
    t('steps.welcome'),
    t('steps.findApiary'),
    t('steps.requestSent'),
  ];
  const steps = flow === 'join' ? joinSteps : createSteps;

  const { data: apiaries, isLoading: apiariesLoading } = useApiaries();
  const hasApiaries = !!apiaries && apiaries.length > 0;
  const { data: hives, isLoading: hivesLoading } = useHives(undefined, {
    enabled: hasApiaries,
  });

  const apiaryMutation = useCreateApiary();
  const hiveMutation = useCreateHive();

  const {
    data: foundApiaries,
    isLoading: lookupLoading,
    error: lookupError,
  } = useLookupApiariesByOwnerEmail(lookupEmail, !!lookupEmail);
  const joinRequestMutation = useCreateJoinRequest();

  useEffect(() => {
    if (apiariesLoading || hivesLoading) return;

    const hasA = apiaries && apiaries.length > 0;
    const hasH = hives && hives.length > 0;

    if (hasA && hasH) {
      window.location.href = '/';
      return;
    }

    if (hasA) {
      const existingApiary = apiaries[0];
      setApiary(existingApiary);
      setActiveApiaryId(existingApiary.id);
      setFlow('create');
      setStep(2);
    } else {
      setStep(0);
    }
  }, [apiaries, hives, apiariesLoading, hivesLoading, setActiveApiaryId]);

  const handleChooseCreate = () => { setFlow('create'); setStep(1); };
  const handleChooseJoin = () => { setFlow('join'); setStep(1); };
  const handleLookup = () => { setLookupEmail(ownerEmail); };

  const handleSendJoinRequest = async () => {
    if (!selectedApiaryId) return;
    try {
      await joinRequestMutation.mutateAsync({ apiaryId: selectedApiaryId });
      setStep(2);
    } catch { /* error shown inline */ }
  };

  const handleApiarySubmit = async (data: ApiaryFormData) => {
    try {
      const result = await apiaryMutation.mutateAsync({ ...data });
      setApiary(result);
      setActiveApiaryId(result.id);
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

  const handleFinish = () => { window.location.href = '/'; };

  if (step === null) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 mt-10 p-4">
        <Card className="w-full max-w-3xl">
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const lookupErrorMessage =
    lookupError && (lookupError as any)?.response?.data?.message
      ? (lookupError as any).response.data.message
      : lookupError
        ? 'No apiaries found for that email address.'
        : null;

  const joinErrorMessage =
    joinRequestMutation.error && (joinRequestMutation.error as any)?.response?.data?.message
      ? (joinRequestMutation.error as any).response.data.message
      : null;

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 mt-10 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
          <div className="mt-6">
            <Stepper steps={steps} currentStep={step} />
          </div>
        </CardHeader>

        <CardContent>
          {step === 0 && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-6">
                <img src="/hive-pal-logo.png" className="w-24" alt="Hive-Pal Logo" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{t('welcome.title')}</h3>
              <p className="mb-8 text-muted-foreground max-w-lg mx-auto">
                {t('welcome.description')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                <button
                  onClick={handleChooseCreate}
                  className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-transparent bg-amber-50 hover:border-amber-400 transition-colors cursor-pointer"
                >
                  <Building2 className="h-10 w-10 text-amber-500" />
                  <span className="font-semibold text-sm">{t('welcome.actionCreate')}</span>
                </button>
                <button
                  onClick={handleChooseJoin}
                  className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-transparent bg-slate-100 hover:border-slate-400 transition-colors cursor-pointer"
                >
                  <Users className="h-10 w-10 text-slate-500" />
                  <span className="font-semibold text-sm">{t('welcome.actionJoin')}</span>
                </button>
              </div>
            </div>
          )}

          {flow === 'create' && step === 1 && (
            <div className="py-4">
              <h3 className="text-xl font-semibold mb-4">{t('apiary.title')}</h3>
              <p className="mb-6 text-muted-foreground">{t('apiary.description')}</p>
              <ApiaryForm onSubmit={handleApiarySubmit} isLoading={apiaryMutation.isPending} />
            </div>
          )}

          {flow === 'create' && step === 2 && apiary && (
            <div className="py-4">
              <h3 className="text-xl font-semibold mb-4">{t('hive.title')}</h3>
              <p className="mb-6 text-muted-foreground">
                {t('hive.description', { apiaryName: apiary.name })}
              </p>
              <HiveForm onSubmit={handleHiveSubmit} isLoading={hiveMutation.isPending} />
            </div>
          )}

          {flow === 'create' && step === 3 && (
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

          {flow === 'join' && step === 1 && (
            <div className="py-4 space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">{t('join.title')}</h3>
                <p className="text-muted-foreground">{t('join.description')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-email">{t('join.emailLabel')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="owner-email"
                    type="email"
                    placeholder={t('join.emailPlaceholder')}
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  />
                  <Button onClick={handleLookup} disabled={!ownerEmail || lookupLoading} variant="outline">
                    {lookupLoading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : t('join.lookupButton')}
                  </Button>
                </div>
                {lookupErrorMessage && (
                  <p className="text-sm text-destructive">{lookupErrorMessage}</p>
                )}
              </div>

              {foundApiaries && foundApiaries.length > 0 && (
                <div className="space-y-2">
                  <Label>{t('join.selectApiary')}</Label>
                  <div className="space-y-2">
                    {foundApiaries.map((a: ApiaryOption) => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedApiaryId(a.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                          selectedApiaryId === a.id
                            ? 'border-amber-400 bg-amber-50'
                            : 'border-border hover:border-amber-300'
                        }`}
                      >
                        <span className="font-medium">{a.name}</span>
                      </button>
                    ))}
                  </div>
                  {joinErrorMessage && (
                    <p className="text-sm text-destructive">{joinErrorMessage}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {flow === 'join' && step === 2 && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-6">
                <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckIcon className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-4">{t('joinSent.title')}</h3>
              <p className="mb-6 text-muted-foreground max-w-lg mx-auto">
                {t('joinSent.description')}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {flow === 'create' && step === 3 && (
            <div className="w-full">
              <Button onClick={handleFinish} className="w-full" data-umami-event="Onboarding Complete">
                {t('complete.action')}
              </Button>
            </div>
          )}

          {flow === 'join' && step === 1 && (
            <div className="w-full flex gap-2">
              <Button variant="outline" onClick={() => { setFlow('none'); setStep(0); }}>
                {t('join.back')}
              </Button>
              <Button
                className="flex-1"
                onClick={handleSendJoinRequest}
                disabled={!selectedApiaryId || joinRequestMutation.isPending}
              >
                {joinRequestMutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t('join.sending')}</>
                  : t('join.sendRequest')}
              </Button>
            </div>
          )}

          {flow === 'join' && step === 2 && (
            <div className="w-full">
              <Button onClick={handleFinish} className="w-full">
                {t('joinSent.action')}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
