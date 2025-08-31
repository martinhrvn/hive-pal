import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CalendarIcon, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useHives } from '@/api/hooks/useHives';
import { useCreateAction } from '@/api/hooks/useActions';
import { CreateStandaloneAction, ActionType } from 'shared-schemas';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// ActionType is now imported from shared-schemas

interface BulkActionValue {
  type: ActionType;
  feedType?: string;
  amount?: number;
  unit?: string;
  concentration?: string;
  product?: string;
  quantity?: number;
  content?: string;
  notes?: string;
}

interface HiveActionValue extends BulkActionValue {
  hiveId: string;
  hiveName: string;
  customized?: boolean;
}

interface BulkActionFormData {
  date: Date;
  selectedHives: string[];
  actionType: ActionType | '';
  defaultValue: BulkActionValue;
  hiveValues: Record<string, HiveActionValue>;
}

export const BulkActionsPage = () => {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [expandedHives, setExpandedHives] = useState<Set<string>>(new Set());
  
  const { data: hives = [], isLoading: hivesLoading } = useHives();
  const createAction = useCreateAction();

  const methods = useForm<BulkActionFormData>({
    defaultValues: {
      date: new Date(),
      selectedHives: [],
      actionType: '',
      defaultValue: {},
      hiveValues: {},
    },
  });

  const { watch, setValue, getValues } = methods;
  const selectedHives = watch('selectedHives');
  const actionType = watch('actionType');
  const defaultValue = watch('defaultValue');

  const handleHiveSelection = (hiveId: string, checked: boolean) => {
    const currentSelection = getValues('selectedHives');
    const hiveValues = getValues('hiveValues');
    
    if (checked) {
      setValue('selectedHives', [...currentSelection, hiveId]);
      const hive = hives.find(h => h.id === hiveId);
      if (hive) {
        setValue(`hiveValues.${hiveId}`, {
          ...defaultValue,
          hiveId,
          hiveName: hive.name,
          type: actionType as ActionType,
        });
      }
    } else {
      setValue('selectedHives', currentSelection.filter(id => id !== hiveId));
      const newHiveValues = { ...hiveValues };
      delete newHiveValues[hiveId];
      setValue('hiveValues', newHiveValues);
    }
  };

  const toggleHiveExpansion = (hiveId: string) => {
    const newExpanded = new Set(expandedHives);
    if (newExpanded.has(hiveId)) {
      newExpanded.delete(hiveId);
    } else {
      newExpanded.add(hiveId);
    }
    setExpandedHives(newExpanded);
  };

  const updateDefaultValue = (field: string, value: any) => {
    const newDefaultValue = { ...defaultValue, [field]: value };
    setValue('defaultValue', newDefaultValue);
    
    // Update all non-customized hive values
    const hiveValues = getValues('hiveValues');
    const updatedHiveValues = { ...hiveValues };
    
    Object.keys(updatedHiveValues).forEach(hiveId => {
      if (!updatedHiveValues[hiveId].customized) {
        updatedHiveValues[hiveId] = {
          ...updatedHiveValues[hiveId],
          [field]: value,
        };
      }
    });
    
    setValue('hiveValues', updatedHiveValues);
  };

  const updateHiveValue = (hiveId: string, field: string, value: any) => {
    setValue(`hiveValues.${hiveId}`, {
      ...getValues(`hiveValues.${hiveId}`),
      [field]: value,
      customized: true,
    });
  };

  const handleSave = async () => {
    const values = getValues();
    
    if (values.selectedHives.length === 0) {
      toast.error('Please select at least one hive');
      return;
    }
    
    if (!values.actionType) {
      toast.error('Please select an action type');
      return;
    }

    try {
      const promises = values.selectedHives.map(async (hiveId) => {
        const hiveValue = values.hiveValues[hiveId];
        let details: Record<string, unknown> = {};
        
        if (hiveValue.type === 'FEEDING') {
          details = {
            type: 'FEEDING',
            feedType: hiveValue.feedType,
            amount: hiveValue.amount,
            unit: hiveValue.unit,
            concentration: hiveValue.concentration,
          };
        } else if (hiveValue.type === 'TREATMENT') {
          details = {
            type: 'TREATMENT',
            product: hiveValue.product,
            quantity: hiveValue.quantity,
            unit: hiveValue.unit,
          };
        } else if (hiveValue.type === 'FRAME') {
          details = {
            type: 'FRAME',
            quantity: hiveValue.quantity,
          };
        } else if (hiveValue.type === 'NOTE') {
          details = {
            type: 'NOTE',
            content: hiveValue.content,
          };
        }

        const data: CreateStandaloneAction = {
          hiveId,
          type: hiveValue.type,
          details: details as CreateStandaloneAction['details'],
          notes: hiveValue.notes,
          date: values.date.toISOString(),
        };

        return createAction.mutateAsync(data);
      });

      await Promise.all(promises);
      toast.success(`Successfully saved actions for ${values.selectedHives.length} hive(s)`);
      
      // Reset form
      methods.reset();
      setExpandedHives(new Set());
      setIsCustomizing(false);
    } catch {
      toast.error('Failed to save some actions. Please try again.');
    }
  };

  const renderActionFields = (value: BulkActionValue, onChange: (field: string, val: any) => void, prefix = '') => {
    switch (actionType) {
      case 'FEEDING':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`${prefix}feedType`}>Feed Type</Label>
              <Select
                value={value.feedType || ''}
                onValueChange={(val) => onChange('feedType', val)}
              >
                <SelectTrigger id={`${prefix}feedType`}>
                  <SelectValue placeholder="Select feed type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SYRUP_1_1">Syrup 1:1</SelectItem>
                  <SelectItem value="SYRUP_2_1">Syrup 2:1</SelectItem>
                  <SelectItem value="FONDANT">Fondant</SelectItem>
                  <SelectItem value="POLLEN_PATTY">Pollen Patty</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`${prefix}amount`}>Amount</Label>
                <Input
                  id={`${prefix}amount`}
                  type="number"
                  value={value.amount || ''}
                  onChange={(e) => onChange('amount', parseFloat(e.target.value))}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label htmlFor={`${prefix}unit`}>Unit</Label>
                <Select
                  value={value.unit || ''}
                  onValueChange={(val) => onChange('unit', val)}
                >
                  <SelectTrigger id={`${prefix}unit`}>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor={`${prefix}concentration`}>Concentration (optional)</Label>
              <Input
                id={`${prefix}concentration`}
                value={value.concentration || ''}
                onChange={(e) => onChange('concentration', e.target.value)}
                placeholder="e.g., 1:1, 2:1"
              />
            </div>
          </div>
        );
      
      case 'TREATMENT':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`${prefix}product`}>Product</Label>
              <Input
                id={`${prefix}product`}
                value={value.product || ''}
                onChange={(e) => onChange('product', e.target.value)}
                placeholder="Enter treatment product"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`${prefix}quantity`}>Quantity</Label>
                <Input
                  id={`${prefix}quantity`}
                  type="number"
                  value={value.quantity || ''}
                  onChange={(e) => onChange('quantity', parseFloat(e.target.value))}
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <Label htmlFor={`${prefix}unit`}>Unit</Label>
                <Select
                  value={value.unit || ''}
                  onValueChange={(val) => onChange('unit', val)}
                >
                  <SelectTrigger id={`${prefix}unit`}>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strips">strips</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="tablets">tablets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      
      case 'FRAME':
        return (
          <div>
            <Label htmlFor={`${prefix}quantity`}>Number of Frames</Label>
            <Input
              id={`${prefix}quantity`}
              type="number"
              value={value.quantity || ''}
              onChange={(e) => onChange('quantity', parseInt(e.target.value))}
              placeholder="Enter number of frames"
            />
          </div>
        );
      
      case 'NOTE':
        return (
          <div>
            <Label htmlFor={`${prefix}content`}>Note Content</Label>
            <textarea
              id={`${prefix}content`}
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={value.content || ''}
              onChange={(e) => onChange('content', e.target.value)}
              placeholder="Enter note content"
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  if (hivesLoading) {
    return <div>Loading hives...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bulk Actions</h1>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Action Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !watch('date') && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watch('date') ? (
                      format(watch('date'), 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watch('date')}
                    onSelect={(date) => date && setValue('date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Hive Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Hives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {hives.map((hive) => (
                  <div key={hive.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={hive.id}
                      checked={selectedHives.includes(hive.id)}
                      onCheckedChange={(checked) => 
                        handleHiveSelection(hive.id, checked as boolean)
                      }
                      disabled={!actionType}
                    />
                    <Label
                      htmlFor={hive.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {hive.name}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedHives.length > 0 && (
                <div className="mt-4 text-sm text-muted-foreground">
                  {selectedHives.length} hive(s) selected
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Type and Default Values */}
          <Card>
            <CardHeader>
              <CardTitle>Action Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="actionType">Action Type</Label>
                <Select
                  value={actionType}
                  onValueChange={(value) => {
                    setValue('actionType', value as ActionType);
                    setValue('defaultValue', { type: value as ActionType });
                    setValue('hiveValues', {});
                    selectedHives.forEach(hiveId => {
                      const hive = hives.find(h => h.id === hiveId);
                      if (hive) {
                        setValue(`hiveValues.${hiveId}`, {
                          type: value as ActionType,
                          hiveId,
                          hiveName: hive.name,
                        });
                      }
                    });
                  }}
                >
                  <SelectTrigger id="actionType">
                    <SelectValue placeholder="Select action type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FEEDING">Feeding</SelectItem>
                    <SelectItem value="TREATMENT">Treatment</SelectItem>
                    <SelectItem value="FRAME">Frames</SelectItem>
                    <SelectItem value="NOTE">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {actionType && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-4">Default Values</h3>
                    {renderActionFields(defaultValue, updateDefaultValue)}
                  </div>
                  
                  <div>
                    <Label htmlFor="defaultNotes">Notes (optional)</Label>
                    <textarea
                      id="defaultNotes"
                      className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                      value={defaultValue.notes || ''}
                      onChange={(e) => updateDefaultValue('notes', e.target.value)}
                      placeholder="Add any additional notes"
                    />
                  </div>

                  {selectedHives.length > 0 && (
                    <div className="flex items-center space-x-2 pt-4">
                      <Checkbox
                        id="customize"
                        checked={isCustomizing}
                        onCheckedChange={(checked) => setIsCustomizing(checked as boolean)}
                      />
                      <Label htmlFor="customize">
                        Customize values for individual hives
                      </Label>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Individual Hive Customization */}
          {isCustomizing && selectedHives.length > 0 && actionType && (
            <Card>
              <CardHeader>
                <CardTitle>Customize Individual Hives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedHives.map((hiveId) => {
                  const hiveValue = getValues(`hiveValues.${hiveId}`);
                  const isExpanded = expandedHives.has(hiveId);
                  
                  return (
                    <Collapsible
                      key={hiveId}
                      open={isExpanded}
                      onOpenChange={() => toggleHiveExpansion(hiveId)}
                    >
                      <div className="border rounded-lg p-4">
                        <CollapsibleTrigger className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-2">
                            <ChevronRight
                              className={cn(
                                "h-4 w-4 transition-transform",
                                isExpanded && "transform rotate-90"
                              )}
                            />
                            <span className="font-medium">{hiveValue?.hiveName}</span>
                            {hiveValue?.customized && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Customized
                              </span>
                            )}
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="pt-4">
                          <div className="space-y-4">
                            {renderActionFields(
                              hiveValue || {},
                              (field, value) => updateHiveValue(hiveId, field, value),
                              `hive-${hiveId}-`
                            )}
                            
                            <div>
                              <Label htmlFor={`hive-${hiveId}-notes`}>Notes (optional)</Label>
                              <textarea
                                id={`hive-${hiveId}-notes`}
                                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                                value={hiveValue?.notes || ''}
                                onChange={(e) => updateHiveValue(hiveId, 'notes', e.target.value)}
                                placeholder="Add any additional notes for this hive"
                              />
                            </div>
                            
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setValue(`hiveValues.${hiveId}`, {
                                  ...defaultValue,
                                  hiveId,
                                  hiveName: hiveValue?.hiveName || '',
                                  type: actionType as ActionType,
                                  customized: false,
                                });
                              }}
                            >
                              Reset to Default
                            </Button>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                methods.reset();
                setExpandedHives(new Set());
                setIsCustomizing(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={createAction.isPending || selectedHives.length === 0 || !actionType}
            >
              {createAction.isPending ? 'Saving...' : `Save Actions for ${selectedHives.length} Hive(s)`}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};