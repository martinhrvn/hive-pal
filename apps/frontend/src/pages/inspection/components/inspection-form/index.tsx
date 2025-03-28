import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils.ts';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { InspectionFormData, inspectionSchema } from './schema';
import { WeatherSection } from '@/pages/inspection/components/inspection-form/weather.tsx';
import { ObservationsSection } from '@/pages/inspection/components/inspection-form/observations.tsx';
import { NotesSection } from '@/pages/inspection/components/inspection-form/notes.tsx';
import { Separator } from '@/components/ui/separator';
import { ActionsSection } from '@/pages/inspection/components/inspection-form/actions.tsx';
import { FeedType } from './actions/feeding';
import {
  useCreateInspection,
  useHiveOptions,
  useInspection,
  useUpdateInspection,
} from '@/api/hooks';
import { ActionType, CreateAction } from 'shared-schemas';

type InspectionFormProps = {
  hiveId?: string;
  inspectionId?: string;
};

export const InspectionForm: React.FC<InspectionFormProps> = ({
  hiveId,
  inspectionId,
}) => {
  const navigate = useNavigate();
  const { data: hives } = useHiveOptions();

  // Use our new custom hooks
  const { data: inspection } = useInspection(inspectionId as string, {
    enabled: !!inspectionId,
  });

  const form = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      hiveId,
      ...inspection,
      date: inspection?.date ? new Date(inspection.date) : new Date(),
      actions:
        inspection?.actions?.map(action => {
          if (action.details.type === ActionType.FEEDING) {
            const details = action.details;
            return {
              type: ActionType.FEEDING,
              notes: action.notes,
              feedType: details.feedType as FeedType,
              quantity: details.amount,
              unit: details.unit,
              concentration: details.concentration,
            };
          } else if (action.details.type === ActionType.TREATMENT) {
            const details = action.details;
            return {
              type: ActionType.TREATMENT,
              notes: action.notes,
              amount: details.quantity,
              treatmentType: details.product,
              unit: details.unit,
            };
          } else if (action.details.type === ActionType.FRAME) {
            const details = action.details;
            return {
              type: ActionType.FRAME,
              notes: action.notes,
              frames: details.quantity,
            };
          } else {
            return {
              type: ActionType.OTHER,
              notes: action.notes,
            };
          }
        }) || [],
    },
  });

  const hiveIdFromForm =
    useWatch({ name: 'hiveId', control: form.control }) ?? hiveId;
  const hiveForUrl = inspection?.hiveId ?? hiveIdFromForm;
  const url = inspectionId
    ? `/inspections/${inspectionId}`
    : `/hives/${hiveForUrl}`;

  // Use our new custom hooks
  const { mutate: createInspectionMutation } = useCreateInspection();
  const { mutate: updateInspectionMutation } = useUpdateInspection();

  const onSubmit = (data: InspectionFormData) => {
    // Transform actions to match API format
    const transformedActions = data.actions
      ?.map((action): CreateAction | null => {
        switch (action.type) {
          case 'FEEDING':
            return {
              type: action.type,
              notes: action.notes,
              details: {
                type: action.type,
                feedType: action.feedType,
                amount: action.quantity,
                unit: action.unit,
                concentration: action.concentration,
              },
            };
          case 'TREATMENT':
            return {
              type: action.type,
              notes: action.notes,
              details: {
                type: action.type,
                product: action.treatmentType,
                quantity: action.amount,
                unit: action.unit,
              },
            };
          case 'FRAME':
            return {
              type: ActionType.FRAME,
              notes: action.notes,
              details: {
                type: ActionType.FRAME,
                quantity: action.frames,
              },
            };
          default:
            return null;
        }
      })
      .filter((a): a is CreateAction => Boolean(a));

    const formattedData = {
      ...data,
      date: data.date.toISOString(),
      actions: transformedActions,
    };

    if (!inspectionId) {
      createInspectionMutation(formattedData, {
        onSuccess: () => navigate(url),
      });
    } else {
      updateInspectionMutation(
        {
          id: inspectionId,
          data: {
            ...formattedData,
            id: inspectionId,
          },
        },
        {
          onSuccess: () => navigate(url),
        },
      );
    }
  };

  const date = form.watch('date');
  const isInFuture = date && date > new Date();

  return (
    <div className={'max-w-4xl ml-4'}>
      <h1 className={'text-lg font-bold'}>New inspection</h1>
      <Separator className="my-2" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="hiveId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hive</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? hiveId}
                  >
                    <SelectTrigger className={'w-full'}>
                      <SelectValue placeholder={'Select a hive'} />
                    </SelectTrigger>
                    <SelectContent>
                      {hives?.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Inspection date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {isInFuture && (
                  <div className={'p-4 rounded'}>
                    <strong className={'text-blue-500'}>
                      This inspection is scheduled for the future
                    </strong>
                    <p className={'text-blue-500'}>
                      You are scheduling an inspection for a future date.
                    </p>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {!isInFuture && (
            <>
              <hr className={'border-t border-border'} />
              <WeatherSection />

              <hr className={'border-t border-border'} />
              <ObservationsSection />
              <hr className={'border-t border-border'} />
              <ActionsSection />
              <hr className={'border-t border-border'} />
              <NotesSection />
            </>
          )}

          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </Form>
    </div>
  );
};
