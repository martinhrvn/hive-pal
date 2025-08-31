import { MainContent, Page, Sidebar } from '@/components/layout/sidebar-layout';
import { useEquipment } from '@/api/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { EquipmentCounts, InventoryDto } from '@/api/hooks/useEquipment';
import { Loader2, Package, Target, ShoppingCart, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { EquipmentTable } from './components/equipment-table';
import { ConsumablesTable } from './components/consumables-table';
import { CustomEquipmentTable } from './components/custom-equipment-table';
import { ShoppingList } from './components/shopping-list';
import { useEquipmentCalculations } from './hooks/use-equipment-calculations';

const equipmentLabels = {
  deepBoxes: 'Deep Boxes',
  shallowBoxes: 'Shallow/Honey Boxes',
  bottoms: 'Bottom Boards',
  covers: 'Top Covers',
  frames: 'Frames',
  queenExcluders: 'Queen Excluders',
  feeders: 'Feeders',
};

const StatsCards = ({
  planData,
}: {
  planData: { needed: number; currentHives: number; targetHives: number };
}) => (
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
);

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
        <Button variant="outline" className="w-full" asChild>
          <Link to="/equipment/settings">Equipment Settings</Link>
        </Button>
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

const SaveChangesSection = ({
  hasChanges,
  onCancel,
  onSave,
  isPending,
}: {
  hasChanges: boolean;
  onCancel: () => void;
  onSave: () => void;
  isPending: boolean;
}) => {
  if (!hasChanges) return null;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex justify-center">
          <div className="space-x-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel Changes
            </Button>
            <Button onClick={onSave} disabled={isPending} size="lg">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save All Changes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const EquipmentPlanningPage = () => {
  const { plan, inventory, updateInventory, settings } = useEquipment();
  const [localInventory, setLocalInventory] = useState<InventoryDto | null>(
    null,
  );

  const localPlanData = useEquipmentCalculations(
    plan.data,
    inventory.data ?? null,
    localInventory,
  );

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

  const handleConsumableExtraChange = (
    type: 'sugar' | 'syrup',
    value: number,
  ) => {
    const updatedInventory = {
      ...inventoryData,
      [`extra${type.charAt(0).toUpperCase() + type.slice(1)}${type === 'sugar' ? 'Kg' : 'Liters'}`]:
        value,
    } as InventoryDto;
    setLocalInventory(updatedInventory);
  };

  const handleCustomEquipmentExtraChange = (
    customId: string,
    value: number,
  ) => {
    const customEquipment = inventoryData.customEquipment || {};
    const updatedCustomEquipment = {
      ...customEquipment,
      [customId]: {
        ...customEquipment[customId],
        extra: value,
      },
    };
    const updatedInventory = {
      ...inventoryData,
      customEquipment: updatedCustomEquipment,
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
          <StatsCards planData={planData} />

          {/* Equipment Table */}
          <Card>
            <CardHeader>
              <CardTitle>Equipment Planning Overview</CardTitle>
              <p className="text-sm text-muted-foreground">
                Track your current equipment and plan for seasonal expansion
              </p>
            </CardHeader>
            <CardContent>
              <EquipmentTable
                equipmentLabels={equipmentLabels}
                planData={planData}
                inventoryData={inventoryData}
                settings={settings}
                onExtraChange={handleExtraChange}
                onRequiredChange={handleRequiredChange}
                onResetRequired={handleResetRequired}
              />
            </CardContent>
          </Card>

          {/* Consumables Section */}
          {(planData.consumables?.sugar || planData.consumables?.syrup) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Consumables
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track consumable supplies like sugar and syrup
                </p>
              </CardHeader>
              <CardContent>
                <ConsumablesTable
                  consumables={planData.consumables}
                  extraSugarKg={inventoryData.extraSugarKg || 0}
                  extraSyrupLiters={inventoryData.extraSyrupLiters || 0}
                  onConsumableExtraChange={handleConsumableExtraChange}
                />
              </CardContent>
            </Card>
          )}

          {/* Custom Equipment Section */}
          {planData.customEquipment && planData.customEquipment.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Custom Equipment
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track your custom equipment types and supplies
                </p>
              </CardHeader>
              <CardContent>
                <CustomEquipmentTable
                  customEquipment={planData.customEquipment}
                  inventoryCustomEquipment={inventoryData.customEquipment}
                  onCustomEquipmentExtraChange={
                    handleCustomEquipmentExtraChange
                  }
                />
              </CardContent>
            </Card>
          )}

          {/* Save Changes Section */}
          <SaveChangesSection
            hasChanges={hasChanges}
            onCancel={() => setLocalInventory(null)}
            onSave={handleSaveInventory}
            isPending={updateInventory.isPending}
          />

          {/* Shopping List */}
          <ShoppingList equipmentLabels={equipmentLabels} planData={planData} />
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
