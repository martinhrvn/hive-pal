import React from 'react';
import { FieldPath, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { X } from 'lucide-react';
import { InspectionFormData } from './schema';
import { Checkbox } from '@/components/ui/checkbox.tsx';

type ObservationItemProps<T> = {
  name: T;
  label: string;
};
const ObservationItem = <TName extends FieldPath<InspectionFormData>>({
  name,
  label,
}: ObservationItemProps<TName>) => {
  const { control } = useFormContext<InspectionFormData>();
  const [hoveredValue, setHoveredValue] = React.useState<number | null>(null);
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const currentValue = field.value as number | undefined;
        return (
          <FormItem>
            <FormControl>
              <div className="flex md:items-center mb-4 flex-col md:flex-row gap-2 md:gap-2">
                <div className="w-32 min-w-32 mr-4">
                  <label className="text-sm font-medium">{label}</label>
                </div>

                <div className="flex-1">
                  {/* Rating bar with half points */}
                  <div className="flex items-center mb-2">
                    {/* Zero value button */}
                    <button
                      className={`w-8 h-8 rounded-lg flex items-center justify-center mr-2 ${
                        currentValue === 0
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-100'
                      }`}
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        field.onChange(0);
                      }}
                      aria-label="Rate as 0"
                    >
                      0
                    </button>

                    {/* Half point rating buttons */}
                    <div className="grow grid grid-cols-10 gap-1 h-8">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(fullValue => {
                        let color = 'bg-gray-200';
                        if (hoveredValue != null && hoveredValue >= fullValue) {
                          color = 'bg-amber-200';
                        } else if (
                          currentValue != null &&
                          currentValue >= fullValue
                        ) {
                          color = 'bg-amber-300';
                        }

                        return (
                          <button
                            className={`rounded w-full transition duration-300 transition-colors text-xs ${color} ${hoveredValue === fullValue ? 'text-gray-700' : 'text-transparent'}`}
                            onMouseEnter={() => setHoveredValue(fullValue)}
                            onMouseLeave={() => setHoveredValue(null)}
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              field.onChange(fullValue);
                              setHoveredValue(null);
                            }}
                            aria-label={`Rate as ${fullValue}`}
                          >
                            {hoveredValue === fullValue && hoveredValue}
                          </button>
                        );
                      })}
                    </div>

                    {/* Value display */}
                    <div className="ml-4 w-8 h-8 text-center">
                      <span className="text-sm px-2 py-1 h-8 block bg-gray-100 rounded">
                        {currentValue ?? '-'}
                      </span>
                    </div>

                    <Button
                      variant={'ghost'}
                      disabled={currentValue === null}
                      className="ml-2 text-gray-400 hover:text-red-500"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        field.onChange(undefined);
                      }}
                      aria-label="Clear rating"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

export const ObservationsSection: React.FC = () => {
  const { control } = useFormContext<InspectionFormData>();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Observations</h3>
      </div>

      <div className={'grid md:grid-cols-3 grid-cols-2 space-2'}>
        <FormField
          control={control}
          name={`observations.queenSeen`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
              <FormControl>
                <Checkbox
                  checked={field.value ?? undefined}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormLabel>Queen seen</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col col-span-3 space-y-2 mt-5">
          <ObservationItem name={'observations.strength'} label={'Strength'} />
          <ObservationItem
            name={'observations.cappedBrood'}
            label={'Capped Brood'}
          />
          <ObservationItem
            name={'observations.uncappedBrood'}
            label={'Uncapped Brood'}
          />
          <ObservationItem
            name={'observations.honeyStores'}
            label={'Honey Stores'}
          />
          <ObservationItem
            name={'observations.pollenStores'}
            label={'Pollen Stores'}
          />

          <ObservationItem
            name={'observations.queenCells'}
            label={'Queen Cells'}
          />
          <ObservationItem
            name={'observations.swarmCells'}
            label={'Uncapped Brood'}
          />
          <ObservationItem
            name={'observations.supersedureCells'}
            label={'Supersedure Cells'}
          />
        </div>
      </div>
    </div>
  );
};
