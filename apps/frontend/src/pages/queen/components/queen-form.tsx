import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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
import { useHiveControllerFindAll } from 'api-client';

type QueenFormProps = {
  hiveId?: string;
};

export const QueenForm: React.FC<QueenFormProps> = ({ hiveId: propHiveId }) => {
  const navigate = useNavigate();
  const { hiveId: urlHiveId } = useParams();

  // Use either the prop hiveId or the URL hiveId
  const effectiveHiveId = propHiveId || urlHiveId;

  const { data: hives } = useHiveControllerFindAll({
    query: {
      select: data =>
        data.data.map(hive => ({
          value: hive.id,
          label: hive.name,
        })),
    },
  });

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

  const onSubmit = async (data: QueenFormData) => {
    try {
      console.log('Creating queen:', data);

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
                            {hives?.map(option => (
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

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter queen color"
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
