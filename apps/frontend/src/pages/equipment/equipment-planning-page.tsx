import { MainContent, Page, Sidebar } from '@/components/layout/sidebar-layout';
import { useEquipmentNew } from '@/api/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { EquipmentItemWithCalculations, EquipmentPlan } from 'shared-schemas';
import { Loader2, Package, Target, ShoppingCart, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { EquipmentTable } from './components/equipment-table';
import { ShoppingList } from './components/shopping-list';


const StatsCards = ({
  planData,
}: {
  planData: EquipmentPlan;
}) => {
  const totalNeeded = planData.items.reduce((sum, item) => sum + (item.toPurchase && item.toPurchase > 0 ? item.toPurchase : 0), 0);
  
  return (
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
              {totalNeeded}
            </p>
            <p className="text-sm text-muted-foreground">Items Needed</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const EquipmentActionSidebar = ({ 
  onRefresh, 
  multiplier, 
  onMultiplierChange, 
  isUpdatingMultiplier 
}: { 
  onRefresh: () => void;
  multiplier: number;
  onMultiplierChange: (value: number) => void;
  isUpdatingMultiplier: boolean;
}) => (
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
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Multiplier</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={multiplier}
                onChange={(e) => onMultiplierChange(parseFloat(e.target.value) || 1)}
                min="0.1"
                max="10"
                step="0.1"
                className="w-20 text-center"
                disabled={isUpdatingMultiplier}
              />
              <span className="text-xs text-muted-foreground">×</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Target Hives = Current × {multiplier}
            </p>
          </div>
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
  const { plan, items, updateItem, multiplier, updateMultiplier } = useEquipmentNew();
  const [localItems, setLocalItems] = useState<EquipmentItemWithCalculations[]>(
    [],
  );
  const [localMultiplier, setLocalMultiplier] = useState<number>(1.5);

  // Sync multiplier from API when loaded
  useEffect(() => {
    if (multiplier.data?.targetMultiplier) {
      setLocalMultiplier(multiplier.data.targetMultiplier);
    }
  }, [multiplier.data]);

  // Use plan.data.items as they contain the calculations (inUse, total, required, etc.)
  // If we have local changes, merge them with the plan data
  const displayItems = localItems.length > 0 
    ? plan.data?.items.map(planItem => {
        const localItem = localItems.find(local => local.itemId === planItem.itemId);
        return localItem ? { ...planItem, ...localItem } : planItem;
      }) || []
    : (plan.data?.items || []);

  if (plan.isLoading || items.isLoading || multiplier.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (plan.error || items.error || multiplier.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Error loading equipment data</p>
          <Button
            onClick={() => {
              plan.refetch();
              items.refetch();
            }}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!plan.data) {
    return <div>No data available</div>;
  }

  const handleExtraChange = (itemId: string, value: number) => {
    const updatedItems = displayItems.map(item =>
      item.itemId === itemId ? { ...item, extra: value } : item
    );
    setLocalItems(updatedItems);
  };

  const handlePerHiveChange = (itemId: string, value: number) => {
    const updatedItems = displayItems.map(item =>
      item.itemId === itemId ? { ...item, perHive: value } : item
    );
    setLocalItems(updatedItems);
  };

  // These handlers are now unified with handleExtraChange since all items use the same structure

  const handleNeededChange = (itemId: string, value: number) => {
    const updatedItems = displayItems.map(item =>
      item.itemId === itemId ? { ...item, neededOverride: value } : item
    );
    setLocalItems(updatedItems);
  };

  const handleResetNeeded = (itemId: string) => {
    const updatedItems = displayItems.map(item =>
      item.itemId === itemId ? { ...item, neededOverride: null } : item
    );
    setLocalItems(updatedItems);
  };

  const handleSaveChanges = async () => {
    for (const item of localItems) {
      await updateItem.mutateAsync({
        itemId: item.itemId,
        data: {
          extra: item.extra,
          perHive: item.perHive,
          neededOverride: item.neededOverride,
        },
      });
    }
    setLocalItems([]);
  };

  const handleMultiplierChange = (value: number) => {
    setLocalMultiplier(value);
    updateMultiplier.mutate({ targetMultiplier: value });
  };

  const hasChanges = localItems.length > 0;

  return (
    <Page>
      <MainContent>
        <div className="space-y-6">
          {/* Header Cards */}
          <StatsCards planData={plan.data} />

          {/* Unified Equipment Table */}
          <Card>
            <CardHeader>
              <CardTitle>Equipment Planning Overview</CardTitle>
              <p className="text-sm text-muted-foreground">
                Track your current equipment and plan for seasonal expansion
              </p>
            </CardHeader>
            <CardContent>
              <EquipmentTable
                items={displayItems}
                onExtraChange={handleExtraChange}
                onPerHiveChange={handlePerHiveChange}
                onNeededChange={handleNeededChange}
                onResetNeeded={handleResetNeeded}
              />
            </CardContent>
          </Card>

          {/* Save Changes Section */}
          <SaveChangesSection
            hasChanges={hasChanges}
            onCancel={() => setLocalItems([])}
            onSave={handleSaveChanges}
            isPending={updateItem.isPending}
          />

          {/* Shopping List */}
          <ShoppingList items={displayItems} />
        </div>
      </MainContent>

      <Sidebar>
        <EquipmentActionSidebar
          onRefresh={() => {
            plan.refetch();
            items.refetch();
            multiplier.refetch();
          }}
          multiplier={localMultiplier}
          onMultiplierChange={handleMultiplierChange}
          isUpdatingMultiplier={updateMultiplier.isPending}
        />
      </Sidebar>
    </Page>
  );
};
