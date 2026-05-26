import {
  MainContent,
  PageGrid,
  PageAside,
} from '@/components/layout/page-grid-layout';
import { useEquipmentNew } from '@/api/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import {
  EquipmentItemWithCalculations,
  EquipmentPlan,
  UpdateEquipmentItem,
  CreateEquipmentItem,
} from 'shared-schemas';
import { Loader2, Package, Target, ShoppingCart, Wrench, AlertCircle, Plus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { EquipmentTable } from './components/equipment-table';
import { ShoppingList } from './components/shopping-list';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const StatsCards = ({ planData }: { planData: EquipmentPlan }) => {
  const totalNeeded = planData.items.reduce(
    (sum, item) =>
      sum + (item.toPurchase && item.toPurchase > 0 ? item.toPurchase : 0),
    0,
  );
  const { t } = useTranslation('hive');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardContent className="flex items-center p-6">
          <Package className="h-8 w-8 text-blue-600 mr-4" />
          <div>
            <p className="text-2xl font-bold">{planData.currentHives}</p>
            <p className="text-sm text-muted-foreground">
              {t('hive:equipment.currentHives', {
                defaultValue: 'Current Hives',
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-6">
          <Target className="h-8 w-8 text-green-600 mr-4" />
          <div>
            <p className="text-2xl font-bold">{planData.targetHives}</p>
            <p className="text-sm text-muted-foreground">
              {t('hive:equipment.targetHives', {
                defaultValue: 'Target Hives',
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-6">
          <ShoppingCart className="h-8 w-8 text-orange-600 mr-4" />
          <div>
            <p className="text-2xl font-bold">{totalNeeded}</p>
            <p className="text-sm text-muted-foreground">
              {t('hive:equipment.itemsNeeded', {
                defaultValue: 'Items Needed',
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const EquipmentActionSidebar = ({
  onRefresh,
  targetHives,
  currentHives,
  onTargetHivesChange,
  isUpdating,
  t,
}: {
  onRefresh: () => void;
  targetHives: number;
  currentHives: number;
  onTargetHivesChange: (value: number) => void;
  isUpdating: boolean;
  t: TFunction<'hive'>;
}) => {
  const hint =
    targetHives === 0
      ? `Not set — showing requirements for current ${currentHives} hives`
      : targetHives > currentHives
        ? `Planning for ${targetHives - currentHives} more than your current ${currentHives}`
        : targetHives === currentHives
          ? 'Same as current hive count'
          : 'Below current — no equipment needed';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {t('hive:equipment.equipmentManagement', {
              defaultValue: 'Equipment Management',
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={onRefresh} className="w-full">
            {t('hive:actions.refreshData', { defaultValue: 'Refresh Data' })}
          </Button>
          <Separator />
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Hives</label>
            <Input
              type="number"
              value={targetHives === 0 ? '' : targetHives}
              onChange={e =>
                onTargetHivesChange(parseInt(e.target.value) || 0)
              }
              min="0"
              step="1"
              placeholder={`${currentHives} (current)`}
              className="w-full"
              disabled={isUpdating}
            />
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

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
  const { t } = useTranslation('hive');
  if (!hasChanges) return null;
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex justify-center">
          <div className="space-x-4">
            <Button variant="outline" onClick={onCancel}>
              {t('hive:equipment.cancelChanges', {
                defaultValue: 'Cancel Changes',
              })}
            </Button>
            <Button onClick={onSave} disabled={isPending} size="lg">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('hive:equipment.saveAllChanges', {
                defaultValue: 'Save All Changes',
              })}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const EquipmentPlanningPage = () => {
  const {
    plan,
    items,
    updateItem,
    deleteItem,
    createItem,
    multiplier,
    updateMultiplier,
  } = useEquipmentNew();
  const [localItems, setLocalItems] = useState<EquipmentItemWithCalculations[]>(
    [],
  );
  const [localTargetHives, setLocalTargetHives] = useState<number>(0);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const { t } = useTranslation('hive');

  useEffect(() => {
    if (multiplier.data !== undefined) {
      setLocalTargetHives(multiplier.data.targetHives ?? 0);
    }
  }, [multiplier.data]);

  const displayItems =
    localItems.length > 0
      ? plan.data?.items.map(planItem => {
        const localItem = localItems.find(
          local => local.itemId === planItem.itemId,
        );
        return localItem ? { ...planItem, ...localItem } : planItem;
      }) || []
      : plan.data?.items || [];

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
      item.itemId === itemId ? { ...item, extra: value } : item,
    );
    setLocalItems(updatedItems);
  };

  const handlePerHiveChange = (itemId: string, value: number) => {
    const updatedItems = displayItems.map(item =>
      item.itemId === itemId ? { ...item, perHive: value } : item,
    );
    setLocalItems(updatedItems);
  };

  const handleNeededChange = (itemId: string, value: number) => {
    const updatedItems = displayItems.map(item =>
      item.itemId === itemId ? { ...item, neededOverride: value } : item,
    );
    setLocalItems(updatedItems);
  };

  const handleResetNeeded = (itemId: string) => {
    const updatedItems = displayItems.map(item =>
      item.itemId === itemId ? { ...item, neededOverride: null } : item,
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

  const handleTargetHivesChange = (value: number) => {
    setLocalTargetHives(value);
    updateMultiplier.mutate({ targetHives: value });
  };

  const handleUpdateItem = async (
    itemId: string,
    data: UpdateEquipmentItem,
  ) => {
    setUpdatingItems(prev => new Set([...prev, itemId]));
    try {
      await updateItem.mutateAsync({ itemId, data });
      setLocalItems(prev => prev.filter(item => item.itemId !== itemId));
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setDeletingItems(prev => new Set([...prev, itemId]));
    try {
      await deleteItem.mutateAsync(itemId);
      setLocalItems(prev => prev.filter(item => item.itemId !== itemId));
    } finally {
      setDeletingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleCreateItem = async (data: CreateEquipmentItem) => {
    setIsCreating(true);
    try {
      await createItem.mutateAsync(data);
      plan.refetch();
    } finally {
      setIsCreating(false);
    }
  };

  const hasChanges = localItems.length > 0;
  return (
    <PageGrid>
      <MainContent>
        <div className="space-y-6">
          <StatsCards planData={plan.data} />

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>
                  {t('hive:equipment.equipmentPlanningOverview', {
                    defaultValue: 'Equipment Planning Overview',
                  })}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('hive:equipment.trackCurrentEquipment', {
                    defaultValue:
                      'Track your current equipment and plan for seasonal expansion',
                  })}
                </p>
              </div>
              <Button
                onClick={() => setShowAddForm(true)}
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
              >
                <Plus className="h-4 w-4" />
                {t('hive:equipment.table.addEquipment', { defaultValue: 'Add Equipment' })}
              </Button>
            </CardHeader>
            <CardContent className="min-w-0">
              {localTargetHives === 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 mb-4">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Set a target hive count in the sidebar to see how much equipment you'll need.
                </div>
              )}
              <div className="overflow-x-auto">
                <EquipmentTable
                  items={displayItems}
                  onExtraChange={handleExtraChange}
                  onPerHiveChange={handlePerHiveChange}
                  onNeededChange={handleNeededChange}
                  onResetNeeded={handleResetNeeded}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                  onCreate={handleCreateItem}
                  updatingItems={updatingItems}
                  deletingItems={deletingItems}
                  isCreating={isCreating}
                  showAddForm={showAddForm}
                  onShowAddFormChange={setShowAddForm}
                />
              </div>
            </CardContent>
          </Card>

          <SaveChangesSection
            hasChanges={hasChanges}
            onCancel={() => setLocalItems([])}
            onSave={handleSaveChanges}
            isPending={updateItem.isPending}
          />
        </div>
      </MainContent>

      <PageAside>
        <EquipmentActionSidebar
          onRefresh={() => {
            plan.refetch();
            items.refetch();
            multiplier.refetch();
          }}
          targetHives={localTargetHives}
          currentHives={plan.data.currentHives}
          onTargetHivesChange={handleTargetHivesChange}
          isUpdating={updateMultiplier.isPending}
          t={t}
        />
        <ShoppingList items={displayItems} />
      </PageAside>
    </PageGrid>
  );
};
