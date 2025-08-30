import { MainContent, Page, Sidebar } from '@/components/layout/sidebar-layout';
import { useEquipment } from '@/api/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { EquipmentCounts, InventoryDto } from '@/api/hooks/useEquipment';
import {
  Loader2,
  Package,
  Target,
  ShoppingCart,
  Wrench,
  Info,
  RotateCcw,
  Copy,
  Printer,
} from 'lucide-react';
import { EquipmentSettingsDialog } from './components/equipment-settings-dialog';

const equipmentLabels = {
  deepBoxes: 'Deep Boxes',
  shallowBoxes: 'Shallow/Honey Boxes',
  bottoms: 'Bottom Boards',
  covers: 'Top Covers',
  frames: 'Frames',
  queenExcluders: 'Queen Excluders',
  feeders: 'Feeders',
};

const EquipmentRow = ({
  label,
  inUse,
  extra,
  total,
  required,
  recommended,
  needed,
  onExtraChange,
  onRequiredChange,
  onResetRequired,
  equipmentKey,
  targetHives,
  perHive,
}: {
  label: string;
  inUse: number;
  extra: number;
  total: number;
  required: number;
  recommended: number;
  needed: number;
  onExtraChange: (key: keyof EquipmentCounts, value: number) => void;
  onRequiredChange: (key: keyof EquipmentCounts, value: number) => void;
  onResetRequired: (key: keyof EquipmentCounts) => void;
  equipmentKey: keyof EquipmentCounts;
  targetHives: number;
  perHive: number;
}) => {
  const isOverridden = required !== recommended;
  const surplus = total - required;
  const hasSurplus = surplus > 0;

  return (
    <div className="grid grid-cols-5 gap-4 items-center py-3">
      <div className="font-medium">{label}</div>
      <div className="text-center">{inUse}</div>
      <div className="text-center">
        <Input
          type="number"
          value={extra}
          onChange={e =>
            onExtraChange(equipmentKey, parseInt(e.target.value) || 0)
          }
          className="w-20 text-center"
          min="0"
        />
      </div>
      <div className="text-center flex items-center justify-center gap-1">
        <Input
          type="number"
          value={required}
          onChange={e =>
            onRequiredChange(equipmentKey, parseInt(e.target.value) || 0)
          }
          className={cn(
            'w-20 text-center',
            isOverridden && 'text-blue-600 font-medium',
          )}
          min="0"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Recommended: {recommended}</p>
              <p className="text-xs text-muted-foreground">
                Based on {targetHives} hives × {perHive} per hive
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {isOverridden && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onResetRequired(equipmentKey)}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>
      <div className="text-center">
        {needed > 0 ? (
          <Badge variant="destructive">{needed}</Badge>
        ) : hasSurplus ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="cursor-help">
                  +{surplus}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Surplus: {surplus} extra</p>
                <p className="text-xs text-muted-foreground">
                  Total: {total} (In use: {inUse} + Extra: {extra})
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Badge variant="outline">0</Badge>
        )}
      </div>
    </div>
  );
};

const EquipmentActionSidebar = ({ onRefresh }: { onRefresh: () => void }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Equipment Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={onRefresh} className="w-full">
          Refresh Data
        </Button>
        <EquipmentSettingsDialog>
          <Button variant="outline" className="w-full">
            Equipment Settings
          </Button>
        </EquipmentSettingsDialog>
        <Separator />
        <div className="space-y-2 text-sm">
          <p>
            <strong>Target Calculation:</strong>
          </p>
          <p>Target Hives = Current × 1.5</p>
          <p>This ensures 50% buffer for splits and expansion.</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export const EquipmentPlanningPage = () => {
  const { plan, inventory, updateInventory, settings } = useEquipment();
  const [localInventory, setLocalInventory] = useState<InventoryDto | null>(
    null,
  );

  // Calculate local plan data with overrides applied
  const localPlanData = useMemo(() => {
    if (!plan.data || !inventory.data) return null;

    const inventoryData = localInventory || inventory.data;

    // Apply overrides to required values
    const required: EquipmentCounts = {
      deepBoxes:
        inventoryData.requiredDeepBoxesOverride ??
        plan.data.recommended.deepBoxes,
      shallowBoxes:
        inventoryData.requiredShallowBoxesOverride ??
        plan.data.recommended.shallowBoxes,
      bottoms:
        inventoryData.requiredBottomsOverride ?? plan.data.recommended.bottoms,
      covers:
        inventoryData.requiredCoversOverride ?? plan.data.recommended.covers,
      frames:
        inventoryData.requiredFramesOverride ?? plan.data.recommended.frames,
      queenExcluders:
        inventoryData.requiredQueenExcludersOverride ??
        plan.data.recommended.queenExcluders,
      feeders:
        inventoryData.requiredFeedersOverride ?? plan.data.recommended.feeders,
    };

    // Recalculate extra values
    const extra: EquipmentCounts = {
      deepBoxes: inventoryData.extraDeepBoxes,
      shallowBoxes: inventoryData.extraShallowBoxes,
      bottoms: inventoryData.extraBottoms,
      covers: inventoryData.extraCovers,
      frames: inventoryData.extraFrames,
      queenExcluders: inventoryData.extraQueenExcluders,
      feeders: inventoryData.extraFeeders,
    };

    // Recalculate total
    const total: EquipmentCounts = {
      deepBoxes: plan.data.inUse.deepBoxes + extra.deepBoxes,
      shallowBoxes: plan.data.inUse.shallowBoxes + extra.shallowBoxes,
      bottoms: plan.data.inUse.bottoms + extra.bottoms,
      covers: plan.data.inUse.covers + extra.covers,
      frames: plan.data.inUse.frames + extra.frames,
      queenExcluders: plan.data.inUse.queenExcluders + extra.queenExcluders,
      feeders: plan.data.inUse.feeders + extra.feeders,
    };

    // Recalculate needed based on new required values
    const needed: EquipmentCounts = {
      deepBoxes: Math.max(0, required.deepBoxes - total.deepBoxes),
      shallowBoxes: Math.max(0, required.shallowBoxes - total.shallowBoxes),
      bottoms: Math.max(0, required.bottoms - total.bottoms),
      covers: Math.max(0, required.covers - total.covers),
      frames: Math.max(0, required.frames - total.frames),
      queenExcluders: Math.max(
        0,
        required.queenExcluders - total.queenExcluders,
      ),
      feeders: Math.max(0, required.feeders - total.feeders),
    };

    return {
      ...plan.data,
      required,
      extra,
      total,
      needed,
    };
  }, [plan.data, inventory.data, localInventory]);

  if (plan.isLoading || inventory.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (plan.error || inventory.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Error loading equipment data</p>
          <Button
            onClick={() => {
              plan.refetch();
              inventory.refetch();
            }}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const planData = localPlanData || plan.data;
  const inventoryData = localInventory || inventory.data;

  if (!planData || !inventoryData) {
    return <div>No data available</div>;
  }

  const handleExtraChange = (key: keyof EquipmentCounts, value: number) => {
    const updatedInventory = {
      ...inventoryData,
      [`extra${key.charAt(0).toUpperCase() + key.slice(1)}`]: value,
    } as InventoryDto;

    setLocalInventory(updatedInventory);
  };

  const handleRequiredChange = (key: keyof EquipmentCounts, value: number) => {
    const overrideKey =
      `required${key.charAt(0).toUpperCase() + key.slice(1)}Override` as keyof InventoryDto;
    const updatedInventory = {
      ...inventoryData,
      [overrideKey]: value,
    } as InventoryDto;

    setLocalInventory(updatedInventory);
  };

  const handleResetRequired = (key: keyof EquipmentCounts) => {
    const overrideKey =
      `required${key.charAt(0).toUpperCase() + key.slice(1)}Override` as keyof InventoryDto;
    const updatedInventory = {
      ...inventoryData,
      [overrideKey]: null,
    } as InventoryDto;

    setLocalInventory(updatedInventory);
  };

  const handleSaveInventory = () => {
    if (localInventory) {
      updateInventory.mutate(localInventory, {
        onSuccess: () => {
          setLocalInventory(null);
        },
      });
    }
  };

  const hasChanges = localInventory !== null;

  return (
    <Page>
      <MainContent>
        <div className="space-y-6">
          {/* Header Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="flex items-center p-6">
                <Package className="h-8 w-8 text-blue-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold">{planData.currentHives}</p>
                  <p className="text-sm text-muted-foreground">Current Hives</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <Target className="h-8 w-8 text-green-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold">{planData.targetHives}</p>
                  <p className="text-sm text-muted-foreground">Target Hives</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <ShoppingCart className="h-8 w-8 text-orange-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold">
                    {Object.values(planData.needed).reduce(
                      (sum, count) => sum + count,
                      0,
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Items Needed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Equipment Table */}
          <Card>
            <CardHeader>
              <CardTitle>Equipment Planning Overview</CardTitle>
              <p className="text-sm text-muted-foreground">
                Track your current equipment and plan for seasonal expansion
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-5 gap-4 pb-3 border-b font-semibold text-sm">
                  <div>Equipment</div>
                  <div className="text-center">In Use</div>
                  <div className="text-center">Extra</div>
                  <div className="text-center">Required</div>
                  <div className="text-center">Status</div>
                </div>

                {/* Equipment Rows */}
                {Object.entries(equipmentLabels).map(([key, label]) => {
                  const equipmentKey = key as keyof EquipmentCounts;
                  const perHiveKey =
                    `${equipmentKey}PerHive` as keyof typeof settings.data;
                  const perHive = settings.data?.[perHiveKey] || 0;

                  return (
                    <EquipmentRow
                      key={key}
                      label={label}
                      inUse={planData.inUse[equipmentKey]}
                      extra={
                        inventoryData[
                          `extra${equipmentKey.charAt(0).toUpperCase() + equipmentKey.slice(1)}` as keyof InventoryDto
                        ] as number
                      }
                      total={planData.total[equipmentKey]}
                      required={planData.required[equipmentKey]}
                      recommended={planData.recommended[equipmentKey]}
                      needed={planData.needed[equipmentKey]}
                      onExtraChange={handleExtraChange}
                      onRequiredChange={handleRequiredChange}
                      onResetRequired={handleResetRequired}
                      equipmentKey={equipmentKey}
                      targetHives={planData.targetHives}
                      perHive={perHive}
                    />
                  );
                })}

                {hasChanges && (
                  <div className="flex justify-end pt-4 border-t">
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setLocalInventory(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveInventory}
                        disabled={updateInventory.isPending}
                      >
                        {updateInventory.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shopping List */}
          {Object.values(planData.needed).some(count => count > 0) && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Shopping List
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const shoppingList = Object.entries(equipmentLabels)
                          .map(([key, label]) => {
                            const needed =
                              planData.needed[key as keyof EquipmentCounts];
                            return needed > 0 ? `${label}: ${needed}` : null;
                          })
                          .filter(Boolean)
                          .join('\n');

                        const fullList = `Equipment Shopping List\n${new Date().toLocaleDateString()}\n\n${shoppingList}`;

                        navigator.clipboard.writeText(fullList);
                        // You could add a toast notification here
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const shoppingList = Object.entries(equipmentLabels)
                          .map(([key, label]) => {
                            const needed =
                              planData.needed[key as keyof EquipmentCounts];
                            return needed > 0
                              ? `<tr><td style="padding: 8px; border: 1px solid #ddd;">${label}</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${needed}</td></tr>`
                              : null;
                          })
                          .filter(Boolean)
                          .join('');

                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <title>Equipment Shopping List</title>
                                <style>
                                  body { font-family: Arial, sans-serif; padding: 20px; }
                                  h1 { color: #333; }
                                  table { width: 100%; max-width: 500px; border-collapse: collapse; margin-top: 20px; }
                                  th { background-color: #f4f4f4; padding: 10px; border: 1px solid #ddd; text-align: left; }
                                  .date { color: #666; margin-bottom: 20px; }
                                  @media print {
                                    body { padding: 10px; }
                                  }
                                </style>
                              </head>
                              <body>
                                <h1>Equipment Shopping List</h1>
                                <div class="date">${new Date().toLocaleDateString()}</div>
                                <table>
                                  <thead>
                                    <tr>
                                      <th>Equipment</th>
                                      <th style="text-align: right;">Quantity</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${shoppingList}
                                  </tbody>
                                </table>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                          printWindow.print();
                        }
                      }}
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Print
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(equipmentLabels).map(([key, label]) => {
                    const needed =
                      planData.needed[key as keyof EquipmentCounts];
                    return needed > 0 ? (
                      <div
                        key={key}
                        className="flex justify-between items-center p-3 bg-muted rounded"
                      >
                        <span>{label}</span>
                        <Badge variant="secondary">{needed}</Badge>
                      </div>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </MainContent>

      <Sidebar>
        <EquipmentActionSidebar
          onRefresh={() => {
            plan.refetch();
            inventory.refetch();
          }}
        />
      </Sidebar>
    </Page>
  );
};
