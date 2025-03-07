import React, { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { InspectionFormData, ObservationFormData } from './schema';
import { NumericField } from '@/components/common';

// Observation types available for selection
const OBSERVATION_TYPES = [
  { value: 'queen_sighting', label: 'Queen Sighting' },
  { value: 'brood_pattern', label: 'Brood Pattern' },
  { value: 'honey_stores', label: 'Honey Stores' },
  { value: 'pollen_stores', label: 'Pollen Stores' },
  { value: 'population_strength', label: 'Population Strength' },
  { value: 'temperament', label: 'Temperament' },
  { value: 'disease_presence', label: 'Disease Presence' },
  { value: 'pest_presence', label: 'Pest Presence' },
  { value: 'queen_cells', label: 'Queen Cells' },
  { value: 'swarm_tendency', label: 'Swarm Tendency' },
];

// Component for a single observation
const ObservationItem: React.FC<{
  index: number;
  observation: ObservationFormData;
  onRemove: () => void;
}> = ({ index, observation, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { control } = useFormContext<InspectionFormData>();
  
  // Get the label for the observation type
  const getTypeLabel = (value: string) => {
    const type = OBSERVATION_TYPES.find(t => t.value === value);
    return type ? type.label : value;
  };

  return (
    <Card className="mb-4">
      <CardHeader className="py-2 px-4 flex flex-row items-center justify-between cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="text-sm font-medium flex-1">
          {observation.type ? (
            <>
              {getTypeLabel(observation.type)}
              {observation.numericValue ? ` - ${observation.numericValue}/10` : ''}
            </>
          ) : (
            'New Observation'
          )}
        </CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="py-3 space-y-3">
          <FormField
            control={control}
            name={`observations.${index}.type`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select observation type" />
                    </SelectTrigger>
                    <SelectContent>
                      {OBSERVATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
            control={control}
            name={`observations.${index}.numericValue`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value (1-10)</FormLabel>
                <FormControl>
                  <NumericField
                    value={field.value}
                    onChange={field.onChange}
                    min={1}
                    max={10}
                    defaultValue={5}
                    unit="/10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name={`observations.${index}.notes`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional notes about this observation..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      )}
    </Card>
  );
};

export const ObservationsSection: React.FC = () => {
  const { control } = useFormContext<InspectionFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'observations',
  });

  const addObservation = () => {
    append({
      id: uuidv4(),
      type: '',
      numericValue: 5,
      notes: '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Observations</h3>
        <Button 
          type="button" 
          onClick={addObservation} 
          variant="outline" 
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Observation
        </Button>
      </div>
      
      {fields.length === 0 && (
        <div className="text-center p-4 border border-dashed rounded-md">
          <p className="text-muted-foreground">No observations added yet.</p>
          <Button 
            type="button" 
            onClick={addObservation} 
            variant="ghost" 
            size="sm" 
            className="mt-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add your first observation
          </Button>
        </div>
      )}
      
      {fields.map((field, index) => (
        <ObservationItem
          key={field.id}
          index={index}
          observation={field as ObservationFormData}
          onRemove={() => remove(index)}
        />
      ))}
    </div>
  );
};