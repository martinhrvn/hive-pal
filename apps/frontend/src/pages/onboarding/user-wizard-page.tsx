import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  useApiariesControllerCreate,
  useHiveControllerCreate,
  ApiaryResponseDto,
} from 'api-client';

// Import CheckIcon for success step
import { CheckIcon } from 'lucide-react';

export const UserWizardPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [apiary, setApiary] = useState<ApiaryResponseDto | null>(null);

  const steps = ['Welcome', 'Create Apiary', 'Add First Hive', 'Complete'];

  const apiaryMutation = useApiariesControllerCreate();
  const hiveMutation = useHiveControllerCreate();

  const handleApiarySubmit = async (data: ApiaryFormData) => {
    try {
      const result = await apiaryMutation.mutateAsync({ data });
      setApiary(result.data);
      setStep(2);
    } catch (error) {
      console.error('Error creating apiary:', error);
    }
  };

  const handleHiveSubmit = async (data: HiveFormData) => {
    if (!apiary) return;

    try {
      await hiveMutation.mutateAsync({
        data: {
          ...data,
          installationDate: data.installationDate.toISOString(),
          apiaryId: apiary.id,
        },
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
    navigate('/');
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-slate-50 mt-10 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Hive-Pal!</CardTitle>
          <CardDescription>
            Let's set up your beekeeping environment
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
                Start Your Beekeeping Journey
              </h3>
              <p className="mb-6 text-muted-foreground max-w-lg mx-auto">
                Welcome to Hive-Pal, your digital beekeeping assistant! We'll
                guide you through setting up your first apiary and hive to get
                you started.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="py-4">
              <h3 className="text-xl font-semibold mb-4">
                Create Your First Apiary
              </h3>
              <p className="mb-6 text-muted-foreground">
                An apiary is a location where your hives are kept. Let's create
                your first one.
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
                Add Your First Hive
              </h3>
              <p className="mb-6 text-muted-foreground">
                Now let's add your first hive to your new apiary: {apiary.name}.
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
              <h3 className="text-xl font-semibold mb-4">Congratulations!</h3>
              <p className="mb-6 text-muted-foreground max-w-lg mx-auto">
                You've successfully set up your first apiary and hive. You're
                ready to start tracking your beekeeping activities with
                Hive-Pal!
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {step === 0 && (
            <div className="w-full">
              <Button onClick={handleStart} className="w-full">
                Let's Get Started
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="w-full">
              <Button onClick={handleFinish} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
