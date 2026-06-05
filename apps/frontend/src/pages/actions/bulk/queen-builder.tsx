import { forwardRef, useImperativeHandle } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { BulkQueenPayload, StagedItem } from './types';
import type { BuilderHandle } from './action-builder';

const colorOptions = [
  { label: 'Blue', value: 'blue' },
  { label: 'White', value: 'white' },
  { label: 'Yellow', value: 'yellow' },
  { label: 'Red', value: 'red' },
  { label: 'Green', value: 'green' },
];

const statusOptions: BulkQueenPayload['status'][] = [
  'ACTIVE',
  'REPLACED',
  'DEAD',
  'UNKNOWN',
];

interface QueenBuilderForm {
  year: number;
  color: string;
  marking: string;
  source: string;
  status: BulkQueenPayload['status'];
  installedAt: Date;
  replacedAt: Date | null;
}

const buildDefaults = (date: Date): QueenBuilderForm => ({
  year: new Date().getFullYear(),
  color: '',
  marking: '',
  source: '',
  status: 'ACTIVE',
  installedAt: date,
  replacedAt: null,
});

interface QueenBuilderProps {
  /** Default installation date, taken from the shell's batch date. */
  defaultDate: Date;
}

export const QueenBuilder = forwardRef<BuilderHandle, QueenBuilderProps>(
  ({ defaultDate }, ref) => {
    const form = useForm<QueenBuilderForm>({
      defaultValues: buildDefaults(defaultDate),
    });

    useImperativeHandle(ref, () => ({
      buildItems: (hives, date) => {
        const v = form.getValues();
        if (!v.year) return [];
        return hives.map((hive): StagedItem => ({
          kind: 'queen',
          id: `${hive.id}-queen-${Date.now()}-${Math.random()}`,
          hiveId: hive.id,
          hiveName: hive.name,
          date,
          queen: {
            year: v.year,
            color: v.color || null,
            marking: v.marking || null,
            source: v.source || null,
            status: v.status,
            installedAt: v.installedAt ?? date,
            replacedAt: v.replacedAt,
          },
        }));
      },
      reset: () => form.reset(buildDefaults(defaultDate)),
      itemCount: () => (form.getValues().year ? 1 : 0),
    }));

    return (
      <FormProvider {...form}>
        <Form {...form}>
          <form
            onSubmit={e => e.preventDefault()}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value || ''}
                      onChange={e =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : 0,
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
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pick color" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colorOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Input {...field} />
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
                    <Input {...field} />
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map(s => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="installedAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Installed at</FormLabel>
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
                        selected={field.value}
                        onSelect={d => d && field.onChange(d)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </FormProvider>
    );
  },
);

QueenBuilder.displayName = 'QueenBuilder';
