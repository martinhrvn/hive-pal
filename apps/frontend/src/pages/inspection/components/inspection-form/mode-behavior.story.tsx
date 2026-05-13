import * as ReactHookForm from 'react-hook-form';
import { ObservationsSection } from './observations';
import type { InspectionFormData } from './schema';

const ObservationsWithForm = ({
  defaultValues,
  isSubjective,
  broodFrames,
  broodBoxCount,
  showAiForField,
  aiValue,
}: {
  defaultValues: Partial<InspectionFormData>;
  isSubjective: boolean;
  broodFrames?: number | null;
  broodBoxCount?: number | null;
  showAiForField?: string;
  aiValue?: unknown;
}) => {
  const form = ReactHookForm.useForm<InspectionFormData>({
    defaultValues: defaultValues,
  });

  return (
    <ReactHookForm.FormProvider {...form}>
      <form>
        <ObservationsSection
          isSubjective={isSubjective}
          broodFrames={broodFrames}
          broodBoxCount={broodBoxCount}
          isAiSuggested={field => field === showAiForField}
          aiMergeState={
            showAiForField
              ? ({
                  suggestions: {
                    [showAiForField]: {
                      aiValue,
                      status: 'pending',
                      hasConflict: false,
                    },
                  },
                } as never)
              : undefined
          }
        />
      </form>
    </ReactHookForm.FormProvider>
  );
};

export const DataDrivenObservationsWithForm = () => (
  <ObservationsWithForm
    isSubjective={false}
    broodFrames={10}
    broodBoxCount={2}
    defaultValues={{
      observations: {
        strength: 3,
        queenCells: 1,
      },
    }}
  />
);

export const SubjectiveObservationsWithAi = () => (
  <ObservationsWithForm
    isSubjective
    defaultValues={{
      observations: {
        cappedBrood: undefined,
      },
    }}
    showAiForField="observations.cappedBrood"
    aiValue={7}
  />
);
