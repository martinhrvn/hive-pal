import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
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

const COLOR_OPTIONS = [
  {
    label: 'Blue',
    value: 'blue',
    style: 'bg-blue-500',
  },
  {
    label: 'Green',
    value: 'green',
    style: 'bg-green-500',
  },
  {
    label: 'Red',
    value: 'red',
    style: 'bg-red-500',
  },
  {
    label: 'Yellow',
    value: 'yellow',
    style: 'bg-yellow-500',
  },
  {
    label: 'Purple',
    value: 'purple',
    style: 'bg-purple-500',
  },
  {
    label: 'Indigo',
    value: 'indigo',
    style: 'bg-indigo-500',
  },
  {
    label: 'Pink',
    value: 'pink',
    style: 'bg-pink-500',
  },
  {
    label: 'Gray',
    value: 'gray',
    style: 'bg-gray-500',
  },
  {
    label: 'Black',
    value: 'black',
    style: 'bg-black',
  },
  {
    label: 'White',
    value: 'white',
    style: 'bg-white border border-gray-300',
  },
];

export const QueenForm: React.FC<QueenFormProps> = ({ hiveId: propHiveId }) => {
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
          <CardTitle>New Queen</CardTitle>
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
                      <FormLabel>Hive</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a hive" />
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
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter year"
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
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ?? undefined}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                          <SelectContent>
                            {COLOR_OPTIONS.map(option => (
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
                      <FormLabel>Marking</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter queen marking"
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
                    <FormLabel>Source</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter queen source"
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
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="REPLACED">Replaced</SelectItem>
                          <SelectItem value="DEAD">Dead</SelectItem>
                          <SelectItem value="UNKNOWN">Unknown</SelectItem>
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
                      <FormLabel>Installation Date</FormLabel>
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
                                <span>Pick a date</span>
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
                      <FormLabel>Replaced Date (Optional)</FormLabel>
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
                                <span>Pick a date</span>
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
                    This hive already has an active queen. Replacing the queen
                    will mark the current queen as replaced.
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
                  Cancel
                </Button>
                <Button type="submit">Create Queen</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
