import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils.ts';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useApiary } from '@/hooks/use-apiary';
import React, { useEffect, useState, useRef } from 'react';
import { useCreateHive } from '@/api/hooks';
import {
  boxSchema,
  hiveSettingsSchema,
  HiveStatus as HiveStatusEnum,
} from 'shared-schemas';
import {
  BoxBuilder,
  BoxBuilderRef,
} from '../hive-detail-page/box-configurator/BoxBuilder';
import { BoxTypeEnum, BoxVariantEnum } from 'shared-schemas';

const hiveSchema = z.object({
  name: z.string(),
  notes: z.string().optional(),
  apiaryId: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  installationDate: z.date(),
  settings: hiveSettingsSchema,
  boxes: boxSchema,
});

export type HiveFormData = z.infer<typeof hiveSchema>;

type HiveFormProps = {
  onSubmit?: (data: HiveFormData) => void;
  isLoading?: boolean;
};

export const HiveForm: React.FC<HiveFormProps> = ({
  onSubmit: onSubmitOverride,
  isLoading,
}) => {
  const { t } = useTranslation(['hive', 'common']);
  const navigate = useNavigate();
  const { apiaries, activeApiaryId } = useApiary();
  const { mutate } = useCreateHive({
    onSuccess: () => navigate('/'),
  });
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isBoxConfigOpen, setIsBoxConfigOpen] = useState(false);
  const [configureBoxes, setConfigureBoxes] = useState(false);
  const boxBuilderRef = useRef<BoxBuilderRef>(null);
  const apiaryOptions = apiaries?.map(apiary => ({
    value: apiary.id,
    label: `${apiary.name}${apiary.location ? ` (${apiary.location})` : ''}`,
  }));

  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const form = useForm<HiveFormData>({
    resolver: zodResolver(hiveSchema),
    defaultValues: {
      apiaryId: activeApiaryId ?? undefined,
      settings: {
        autumnFeeding: {
          startMonth: 8,
          endMonth: 10,
          amountKg: 12,
        },
        inspection: {
          frequencyDays: 7,
        },
      },
    },
  });

  const onSubmit = (data: HiveFormData) => {
    const boxes = configureBoxes
      ? boxBuilderRef.current?.getBoxes()
      : undefined;
    const finalData = {
      ...data,
      boxes: boxes?.map(box => ({
        ...box,
        id: box.id?.startsWith('temp-') ? undefined : box.id,
      })),
    };

    if (onSubmitOverride) {
      return onSubmitOverride(finalData);
    } else {
      mutate({
        ...finalData,
        status: data.status as HiveStatusEnum,
        installationDate: data.installationDate.toISOString(),
      });
    }
  };

  useEffect(() => {
    if (activeApiaryId) {
      form.setValue('apiaryId', activeApiaryId);
    }
  }, [activeApiaryId, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('hive:fields.label')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('hive:form.hivePlaceholder')}
                  {...field}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="apiaryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('hive:fields.apiary')}</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={activeApiaryId ?? field.value}
                >
                  <SelectTrigger className={'w-full'}>
                    <SelectValue placeholder={t('hive:form.selectHive')} />
                  </SelectTrigger>
                  <SelectContent>
                    {apiaryOptions?.map(option => (
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('hive:fields.notes')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('hive:form.notesPlaceholder')}
                  {...field}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="installationDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('hive:fields.installationDate')}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-[240px] pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP')
                      ) : (
                        <span>{t('hive:form.pickDate')}</span>
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
                    disabled={date =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              type="button"
              className="w-full justify-between"
            >
              Advanced Settings
              {isAdvancedOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="text-sm text-muted-foreground mb-2">
              Configure feeding and inspection preferences for this hive
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="settings.autumnFeeding.startMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Autumn Feeding Start</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={value => field.onChange(Number(value))}
                        value={field.value?.toString()}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {monthOptions.map(month => (
                            <SelectItem
                              key={month.value}
                              value={month.value.toString()}
                            >
                              {month.label}
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
                name="settings.autumnFeeding.endMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Autumn Feeding End</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={value => field.onChange(Number(value))}
                        value={field.value?.toString()}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {monthOptions.map(month => (
                            <SelectItem
                              key={month.value}
                              value={month.value.toString()}
                            >
                              {month.label}
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
                name="settings.autumnFeeding.amountKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Autumn Feeding (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="12"
                        {...field}
                        onChange={e =>
                          field.onChange(Number(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.inspection.frequencyDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspection Frequency (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        placeholder="7"
                        {...field}
                        onChange={e =>
                          field.onChange(Number(e.target.value) || 7)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={isBoxConfigOpen} onOpenChange={setIsBoxConfigOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              type="button"
              className="w-full justify-between"
            >
              Box Configuration
              {isBoxConfigOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="configure-boxes"
                  checked={configureBoxes}
                  onChange={e => {
                    setConfigureBoxes(e.target.checked);
                    if (
                      e.target.checked &&
                      boxBuilderRef.current?.getBoxes().length === 0
                    ) {
                      // Set default box configuration
                      boxBuilderRef.current?.setBoxes([
                        {
                          id: `temp-${Date.now()}`,
                          position: 0,
                          frameCount: 10,
                          maxFrameCount: 10,
                          hasExcluder: false,
                          type: BoxTypeEnum.BROOD,
                          variant: BoxVariantEnum.LANGSTROTH_DEEP,
                          color: '#3b82f6',
                        },
                      ]);
                    }
                  }}
                  className="h-4 w-4"
                />
                <label
                  htmlFor="configure-boxes"
                  className="text-sm font-medium"
                >
                  Configure initial box setup
                </label>
              </div>

              {configureBoxes && (
                <BoxBuilder
                  ref={boxBuilderRef}
                  simplified={true}
                  initialBoxes={[
                    {
                      id: `temp-${Date.now()}`,
                      position: 0,
                      frameCount: 10,
                      maxFrameCount: 10,
                      hasExcluder: false,
                      type: BoxTypeEnum.BROOD,
                      variant: BoxVariantEnum.LANGSTROTH_DEEP,
                      color: '#3b82f6',
                    },
                  ]}
                />
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Button
          disabled={isLoading}
          type="submit"
          data-umami-event="Hive Create"
        >
          {t('hive:form.submit')}
        </Button>
      </form>
    </Form>
  );
};
