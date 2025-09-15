import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { QueenFormData, queenSchema } from './schema';
import { useMemo } from 'react';
import { useCreateQueen, useHives } from '@/api/hooks';

type QueenFormProps = {
  hiveId?: string;
};

const getColorOptions = (t: (key: string) => string) => [
  {
    label: t('queen:colors.blue'),
    value: 'blue',
    style: 'bg-blue-500',
  },
  {
    label: t('queen:colors.green'),
    value: 'green',
    style: 'bg-green-500',
  },
  {
    label: t('queen:colors.red'),
    value: 'red',
    style: 'bg-red-500',
  },
  {
    label: t('queen:colors.yellow'),
    value: 'yellow',
    style: 'bg-yellow-500',
  },
  {
    label: t('queen:colors.purple'),
    value: 'purple',
    style: 'bg-purple-500',
  },
  {
    label: t('queen:colors.indigo'),
    value: 'indigo',
    style: 'bg-indigo-500',
  },
  {
    label: t('queen:colors.pink'),
    value: 'pink',
    style: 'bg-pink-500',
  },
  {
    label: t('queen:colors.gray'),
    value: 'gray',
    style: 'bg-gray-500',
  },
  {
    label: t('queen:colors.black'),
    value: 'black',
    style: 'bg-black',
  },
  {
    label: t('queen:colors.white'),
    value: 'white',
    style: 'bg-white border border-gray-300',
  },
];

export const QueenForm: React.FC<QueenFormProps> = ({ hiveId: propHiveId }) => {
  const { t } = useTranslation(['queen', 'common']);
  const navigate = useNavigate();
  const { hiveId: urlHiveId } = useParams();

  const effectiveHiveId = propHiveId || urlHiveId;

  const { data: hives } = useHives();

  const hiveOptions = useMemo(() => {
    if (!hives) return [];
    return hives.map(hive => ({
      label: hive.name,
      value: hive.id,
    }));
  }, [hives]);

  const { mutateAsync: createQueen } = useCreateQueen();
  const form = useForm<QueenFormData>({
    resolver: zodResolver(queenSchema),
    defaultValues: {
      hiveId: effectiveHiveId || '',
      marking: '',
      color: '',
      year: new Date().getFullYear(),
      source: '',
      status: 'ACTIVE',
      installedAt: new Date(),
      replacedAt: null,
    },
  });

  const colorValue = useWatch({ control: form.control, name: 'color' });
  const hiveValue = useWatch({ control: form.control, name: 'hiveId' });
  const colorOptions = getColorOptions(t);
  const onSubmit = async (data: QueenFormData) => {
    try {
      await createQueen({
        ...data,
        installedAt: data.installedAt.toISOString(),
        replacedAt: data.replacedAt?.toISOString() ?? null,
      });
      // Navigate to the hive detail page after successful creation
      if (data.hiveId) {
        navigate(`/hives/${data.hiveId}`);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to create queen:', error);
    }
  };

  const selectedHive = useMemo(() => {
    if (!hives) return null;
    return hives.find(hive => hive.id === hiveValue);
  }, [hives, hiveValue]);

  return (
    <div className="container mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>{t('queen:create.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {!effectiveHiveId && (
                <FormField
                  control={form.control}
                  name="hiveId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('queen:fields.hive')}</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('queen:form.selectHive')} />
                          </SelectTrigger>
                          <SelectContent>
                            {hiveOptions?.map(option => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
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
              )}

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('queen:fields.year')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t('queen:form.enterYear')}
                        {...field}
                        value={field.value || ''}
                        onChange={e =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        onBlur={() => {
                          let color: string | null = null;
                          const lastYearDigit = field.value % 10;
                          switch (lastYearDigit) {
                            case 0:
                            case 5:
                              color = 'blue';
                              break;
                            case 1:
                            case 6:
                              color = 'white';
                              break;
                            case 2:
                            case 7:
                              color = 'yellow';
                              break;
                            case 3:
                            case 8:
                              color = 'red';
                              break;
                            case 4:
                            case 9:
                              color = 'green';
                              break;
                          }

                          if (!colorValue && color) {
                            console.log('setting value');
                            form.setValue('color', color);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className={'grid grid-cols-1 md:grid-cols-2 gap-4'}>
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('queen:fields.color')}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ?? undefined}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('queen:form.selectColor')} />
                          </SelectTrigger>
                          <SelectContent>
                            {colorOptions.map(option => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full ${option.style}`}
                                ></div>
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
                  name="marking"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('queen:fields.marking')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('queen:form.enterMarking')}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('queen:fields.source')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('queen:form.enterSource')}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('queen:fields.status')}</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('queen:form.selectStatus')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">{t('queen:status.active')}</SelectItem>
                          <SelectItem value="REPLACED">{t('queen:status.replaced')}</SelectItem>
                          <SelectItem value="DEAD">{t('queen:status.dead')}</SelectItem>
                          <SelectItem value="UNKNOWN">{t('queen:status.unknown')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className={'grid grid-cols-1 md:grid-cols-2 gap-4'}>
                <FormField
                  control={form.control}
                  name="installedAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t('queen:fields.installationDate')}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>{t('queen:form.pickDate')}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="replacedAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t('queen:fields.replacedDate')}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>{t('queen:form.pickDate')}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedHive && selectedHive.activeQueen && (
                <div className="bg-red-100 border border-red-200 p-4 rounded-md">
                  <p className="text-red-800">
                    {t('queen:information.hasActiveQueen')}
                  </p>
                </div>
              )}

              <div className="flex space-x-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    navigate(
                      effectiveHiveId ? `/hives/${effectiveHiveId}` : '/',
                    )
                  }
                >
                  {t('common:actions.cancel')}
                </Button>
                <Button 
                  type="submit"
                  data-umami-event="Queen Create"
                >
                  {t('queen:create.button')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
