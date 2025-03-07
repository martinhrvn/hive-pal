import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form.tsx';
import { Cloud, CloudRain, CloudSun, Sun } from 'lucide-react';
import { InspectionFormData } from '@/pages/inspection/components/inspection-form/schema.ts';
import { useFormContext } from 'react-hook-form';
import { TemperatureField } from '@/components/common';

const weatherConditions = [
  {
    id: 'sunny',
    label: 'Sunny',
    icon: Sun,

    style: 'bg-background border-border hover:border-amber-800',
    styleActive: 'bg-amber-800/20 text-gray-300 border-amber-900',
    iconStyle: 'text-amber-800',
    iconStyleActive: 'text-amber-300',
  },
  {
    id: 'partly-cloudy',
    label: 'Partly cloudy',
    icon: CloudSun,
    style: 'bg-background border-border hover:border-gray-600',
    styleActive: 'bg-gray-800 text-gray-100 border-gray-600',
    iconStyle: 'text-amber-800',
    iconStyleActive: 'text-amber-400',
  },
  {
    id: 'cloudy',
    label: 'Cloudy',
    icon: Cloud,
    style: 'bg-background border-border hover:border-gray-800',
    styleActive: 'bg-gray-800 text-gray-100 border-gray-600',
    iconStyle: 'text-gray-800',
    iconStyleActive: 'text-gray-200',
  },
  {
    id: 'rainy',
    label: 'Rainy',
    icon: CloudRain,
    style: 'bg-background border-border hover:border-blue-800',
    styleActive: 'bg-blue-800/20 text-gray-100 border-blue-900',
    iconStyle: 'text-blue-800',
    iconStyleActive: 'text-blue-200',
  },
];

export const WeatherSection = () => {
  const form = useFormContext<InspectionFormData>();
  return (
    <div>
      <h3 className="text-lg font-medium">Weather information</h3>
      <p className="text-sm text-gray-400">Add weather conditions</p>
      <div className={'space-y-4 py-4 grid grid-cols-1'}>
        <FormField
          control={form.control}
          name="temperature"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Temperature</FormLabel>
              <TemperatureField
                onChange={field.onChange}
                min={0}
                value={field.value ?? null}
                name={field.name}
                max={55}
                onBlur={field.onBlur}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weatherConditions"
          rules={{ required: 'Please select a weather condition' }}
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Condition</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-3 justify-start">
                  {weatherConditions.map(condition => {
                    const Icon = condition.icon;
                    const isSelected = field.value === condition.id;

                    return (
                      <button
                        type={'button'}
                        key={condition.id}
                        onClick={() => field.onChange(condition.id)}
                        onKeyDown={() => {}}
                        className={`
                              flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition-all
                              ${isSelected ? `${condition.styleActive}` : `${condition.style}`}
                            `}
                      >
                        <Icon
                          className={`h-5 w-5 ${isSelected ? condition.iconStyleActive : condition.iconStyle}`}
                        />
                        <span className={`text-sm font-medium`}>
                          {condition.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
