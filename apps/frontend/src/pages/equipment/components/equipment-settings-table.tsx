import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Save,
  Settings,
  Package,
  Droplets,
  Cookie,
  Edit,
  X,
  Check,
  ArrowLeft
} from 'lucide-react';
import { useEquipment, EquipmentSettingsDto, CreateCustomEquipmentTypeDto } from '@/api/hooks/useEquipment';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const equipmentSettingsSchema = z.object({
  // Core equipment tracking toggles and per-hive ratios
  trackDeepBoxes: z.boolean(),
  deepBoxesPerHive: z.number().min(0).max(10),
  
  trackShallowBoxes: z.boolean(),
  shallowBoxesPerHive: z.number().min(0).max(10),
  
  trackBottoms: z.boolean(),
  bottomsPerHive: z.number().min(0).max(5),
  
  trackCovers: z.boolean(),
  coversPerHive: z.number().min(0).max(5),
  
  trackFrames: z.boolean(),
  framesPerHive: z.number().min(0).max(100),
  
  trackQueenExcluders: z.boolean(),
  queenExcludersPerHive: z.number().min(0).max(5),
  
  trackFeeders: z.boolean(),
  feedersPerHive: z.number().min(0).max(5),

  // Consumables
  trackSugar: z.boolean(),
  sugarPerHive: z.number().min(0).max(100),
  
  trackSyrup: z.boolean(),
  syrupPerHive: z.number().min(0).max(100),

  // Planning multiplier
  targetMultiplier: z.number().min(1).max(5).step(0.1),
});

type EquipmentSettingsFormData = z.infer<typeof equipmentSettingsSchema>;

interface EquipmentItem {
  key: string;
  name: string;
  icon: React.ReactNode;
  trackField: keyof EquipmentSettingsFormData;
  perHiveField: keyof EquipmentSettingsFormData;
  unit: string;
  category: string;
}

interface CustomEquipmentFormData {
  name: string;
  unit: string;
  category: string;
  perHiveRatio: number;
}

const EQUIPMENT_ITEMS: EquipmentItem[] = [
  {
    key: 'deepBoxes',
    name: 'Deep Boxes',
    icon: <Package className="h-4 w-4" />,
    trackField: 'trackDeepBoxes',
    perHiveField: 'deepBoxesPerHive',
    unit: 'pieces',
    category: 'Hive Bodies',
  },
  {
    key: 'shallowBoxes',
    name: 'Shallow Boxes',
    icon: <Package className="h-4 w-4" />,
    trackField: 'trackShallowBoxes',
    perHiveField: 'shallowBoxesPerHive',
    unit: 'pieces',
    category: 'Hive Bodies',
  },
  {
    key: 'frames',
    name: 'Frames',
    icon: <Package className="h-4 w-4" />,
    trackField: 'trackFrames',
    perHiveField: 'framesPerHive',
    unit: 'pieces',
    category: 'Hive Bodies',
  },
  {
    key: 'bottoms',
    name: 'Bottom Boards',
    icon: <Package className="h-4 w-4" />,
    trackField: 'trackBottoms',
    perHiveField: 'bottomsPerHive',
    unit: 'pieces',
    category: 'Hive Bodies',
  },
  {
    key: 'covers',
    name: 'Top Covers',
    icon: <Package className="h-4 w-4" />,
    trackField: 'trackCovers',
    perHiveField: 'coversPerHive',
    unit: 'pieces',
    category: 'Hive Bodies',
  },
  {
    key: 'queenExcluders',
    name: 'Queen Excluders',
    icon: <Package className="h-4 w-4" />,
    trackField: 'trackQueenExcluders',
    perHiveField: 'queenExcludersPerHive',
    unit: 'pieces',
    category: 'Hive Bodies',
  },
  {
    key: 'feeders',
    name: 'Feeders',
    icon: <Package className="h-4 w-4" />,
    trackField: 'trackFeeders',
    perHiveField: 'feedersPerHive',
    unit: 'pieces',
    category: 'Hive Bodies',
  },
  {
    key: 'sugar',
    name: 'Sugar',
    icon: <Cookie className="h-4 w-4" />,
    trackField: 'trackSugar',
    perHiveField: 'sugarPerHive',
    unit: 'kg',
    category: 'Consumables',
  },
  {
    key: 'syrup',
    name: 'Syrup',
    icon: <Droplets className="h-4 w-4" />,
    trackField: 'trackSyrup',
    perHiveField: 'syrupPerHive',
    unit: 'liters',
    category: 'Consumables',
  },
];

const COMMON_UNITS = [
  'pieces',
  'kg',
  'grams',
  'liters',
  'ml',
  'meters',
  'cm',
  'sheets',
  'rolls',
  'boxes',
  'bottles',
  'jars',
  'tubes',
  'packs',
];

export const EquipmentSettingsTable = () => {
  const { 
    settings, 
    updateSettings,
    customTypes,
    createCustomType,
    updateCustomType,
    deleteCustomType,
    toggleCustomType
  } = useEquipment();

  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [customFormData, setCustomFormData] = useState<CustomEquipmentFormData>({
    name: '',
    unit: '',
    category: 'custom',
    perHiveRatio: 0,
  });

  const form = useForm<EquipmentSettingsFormData>({
    resolver: zodResolver(equipmentSettingsSchema),
    defaultValues: settings.data || {
      trackDeepBoxes: true,
      deepBoxesPerHive: 1,
      trackShallowBoxes: true,
      shallowBoxesPerHive: 2,
      trackBottoms: true,
      bottomsPerHive: 1,
      trackCovers: true,
      coversPerHive: 1,
      trackFrames: true,
      framesPerHive: 20,
      trackQueenExcluders: true,
      queenExcludersPerHive: 1,
      trackFeeders: false,
      feedersPerHive: 0,
      trackSugar: true,
      sugarPerHive: 12.0,
      trackSyrup: false,
      syrupPerHive: 0.0,
      targetMultiplier: 1.5,
    },
  });

  // Reset form when settings data changes
  useEffect(() => {
    if (settings.data) {
      form.reset(settings.data);
    }
  }, [settings.data, form]);

  const onSubmit = (data: EquipmentSettingsFormData) => {
    updateSettings.mutate(data as EquipmentSettingsDto, {
      onSuccess: () => {
        toast.success("Equipment settings have been updated successfully.");
      },
      onError: () => {
        toast.error("Failed to save equipment settings.");
      },
    });
  };

  const handleAddCustomEquipment = async () => {
    if (!customFormData.name.trim() || !customFormData.unit.trim()) {
      toast.error("Please fill in name and unit fields.");
      return;
    }

    createCustomType.mutate({
      name: customFormData.name,
      unit: customFormData.unit,
      category: customFormData.category,
      perHiveRatio: customFormData.perHiveRatio > 0 ? customFormData.perHiveRatio : null,
    }, {
      onSuccess: () => {
        setIsAddingCustom(false);
        setCustomFormData({ name: '', unit: '', category: 'custom', perHiveRatio: 0 });
        toast.success(`${customFormData.name} has been added to your equipment types.`);
      },
      onError: () => {
        toast.error("Failed to add custom equipment type.");
      },
    });
  };

  const handleUpdateCustomEquipment = async (id: string, data: Partial<CreateCustomEquipmentTypeDto>) => {
    updateCustomType.mutate({ id, data }, {
      onSuccess: () => {
        setEditingCustomId(null);
        toast.success("Equipment type has been updated successfully.");
      },
      onError: () => {
        toast.error("Failed to update custom equipment type.");
      },
    });
  };

  const handleDeleteCustomEquipment = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }

    deleteCustomType.mutate(id, {
      onSuccess: () => {
        toast.success(`${name} has been removed from your equipment types.`);
      },
      onError: () => {
        toast.error("Failed to delete custom equipment type.");
      },
    });
  };

  const handleToggleCustomEquipment = async (id: string, isActive: boolean) => {
    toggleCustomType.mutate({ id, isActive }, {
      onError: () => {
        toast.error("Failed to toggle custom equipment type.");
      },
    });
  };

  if (settings.isLoading || customTypes.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading equipment settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/equipment">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Planning
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Equipment Settings
            </h2>
            <p className="text-muted-foreground">
              Configure which equipment types to track and their ratios per hive for planning.
            </p>
          </div>
        </div>
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          disabled={updateSettings.isPending}
        >
          {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save All Settings
        </Button>
      </div>

      <Form {...form}>
        <form className="space-y-6">
          {/* Core Equipment Table */}
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment Type</TableHead>
                  <TableHead className="text-center">Track</TableHead>
                  <TableHead className="text-center">Per Hive</TableHead>
                  <TableHead className="text-center">Unit</TableHead>
                  <TableHead className="text-center">Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {EQUIPMENT_ITEMS.map((item) => (
                  <TableRow key={item.key}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <FormField
                        control={form.control}
                        name={item.trackField}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <FormField
                        control={form.control}
                        name={item.perHiveField}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                step={item.unit === 'kg' || item.unit === 'liters' ? '0.1' : '1'}
                                className="w-20 text-center"
                                {...field}
                                value={String(field.value)}
                                onChange={(e) => {
                                  const value = item.unit === 'kg' || item.unit === 'liters' 
                                    ? parseFloat(e.target.value) || 0
                                    : parseInt(e.target.value) || 0;
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{item.unit}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{item.category}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Custom Equipment Section */}
          <Separator />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Custom Equipment Types</h3>
                <p className="text-sm text-muted-foreground">
                  Add your own equipment types for tracking and planning.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddingCustom(true)}
                disabled={isAddingCustom}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Custom Type
              </Button>
            </div>

            {(customTypes.data && customTypes.data.length > 0) || isAddingCustom ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment Type</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="text-center">Per Hive</TableHead>
                    <TableHead className="text-center">Unit</TableHead>
                    <TableHead className="text-center">Category</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customTypes.data?.map((customType) => (
                    <TableRow key={customType.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          {editingCustomId === customType.id ? (
                            <Input
                              defaultValue={customType.name}
                              className="w-40"
                              onBlur={(e) => {
                                if (e.target.value !== customType.name) {
                                  handleUpdateCustomEquipment(customType.id, { name: e.target.value });
                                } else {
                                  setEditingCustomId(null);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                } else if (e.key === 'Escape') {
                                  setEditingCustomId(null);
                                }
                              }}
                            />
                          ) : (
                            <span className="font-medium">{customType.name}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={customType.isActive}
                          onCheckedChange={(checked) =>
                            handleToggleCustomEquipment(customType.id, checked)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {editingCustomId === customType.id ? (
                          <Input
                            type="number"
                            step="0.1"
                            defaultValue={customType.perHiveRatio || 0}
                            className="w-20 text-center"
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value) || null;
                              if (value !== customType.perHiveRatio) {
                                handleUpdateCustomEquipment(customType.id, { perHiveRatio: value });
                              } else {
                                setEditingCustomId(null);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              } else if (e.key === 'Escape') {
                                setEditingCustomId(null);
                              }
                            }}
                          />
                        ) : (
                          <span>{customType.perHiveRatio || '—'}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{customType.unit}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{customType.category}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (editingCustomId === customType.id) {
                                setEditingCustomId(null);
                              } else {
                                setEditingCustomId(customType.id);
                              }
                            }}
                          >
                            {editingCustomId === customType.id ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <Edit className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustomEquipment(customType.id, customType.name)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Add Custom Equipment Row */}
                  {isAddingCustom && (
                    <TableRow>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <Input
                            placeholder="Equipment name"
                            value={customFormData.name}
                            onChange={(e) => setCustomFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-40"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={true} disabled />
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0"
                          value={customFormData.perHiveRatio || ''}
                          onChange={(e) => setCustomFormData(prev => ({ 
                            ...prev, 
                            perHiveRatio: parseFloat(e.target.value) || 0 
                          }))}
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Select
                          value={customFormData.unit}
                          onValueChange={(value) => setCustomFormData(prev => ({ ...prev, unit: value }))}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMON_UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center">
                        <Select
                          value={customFormData.category}
                          onValueChange={(value) => setCustomFormData(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">Custom</SelectItem>
                            <SelectItem value="tools">Tools</SelectItem>
                            <SelectItem value="consumables">Consumables</SelectItem>
                            <SelectItem value="seasonal">Seasonal</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleAddCustomEquipment}
                            disabled={createCustomType.isPending}
                          >
                            {createCustomType.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsAddingCustom(false);
                              setCustomFormData({ name: '', unit: '', category: 'custom', perHiveRatio: 0 });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="mx-auto h-12 w-12 opacity-50 mb-4" />
                <p>No custom equipment types added yet.</p>
                <p className="text-sm">Add your first custom equipment type to get started.</p>
              </div>
            )}
          </div>

          {/* Target Multiplier Setting */}
          <Separator />
          
          <div className="flex items-center justify-between p-4 border rounded">
            <div>
              <h4 className="font-medium">Target Multiplier</h4>
              <p className="text-sm text-muted-foreground">
                Planning buffer: Target hives = Current hives × multiplier
              </p>
            </div>
            <FormField
              control={form.control}
              name="targetMultiplier"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      className="w-20 text-center"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value) || 1.5)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </div>
  );
};