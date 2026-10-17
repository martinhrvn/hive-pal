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
  EquipmentPlan,
  UpdateEquipmentItem,
  CreateEquipmentItem,
} from 'shared-schemas';
import {
  Loader2,
  Package,
  Target,
  ShoppingCart,
  Wrench,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { EquipmentTable } from './components/equipment-table';
import { ShoppingList } from './components/shopping-list';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
      ? t('hive:equipment.hintNotSet', { count: currentHives })
      : targetHives > currentHives
        ? t('hive:equipment.hintMore', {
            more: targetHives - currentHives,
            count: currentHives,
          })
        : targetHives === currentHives
          ? t('hive:equipment.hintSame')
          : t('hive:equipment.hintBelow');

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
            <label className="text-sm font-medium">
              {t('hive:equipment.targetHives')}
            </label>
            <Input
              type="number"
              value={targetHives === 0 ? '' : targetHives}
              onChange={e => onTargetHivesChange(parseInt(e.target.value) || 0)}
              min="0"
              step="1"
              placeholder={t('hive:equipment.targetHivesPlaceholder', {
                count: currentHives,
              })}
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
          <p className="text-destructive">{t('hive:equipment.errorLoading')}</p>
          <Button
            onClick={() => {
              plan.refetch();
              items.refetch();
            }}
            className="mt-2"
          >
            {t('hive:equipment.tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  if (!plan.data) {
    return <div>{t('common:messages.noData')}</div>;
  }

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
    } catch (error) {
      toast.error(t('hive:equipment.table.saveFailed'));
      throw error;
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
    } catch (error) {
      toast.error(t('hive:equipment.table.saveFailed'));
      throw error;
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
    } catch (error) {
      toast.error(t('hive:equipment.table.saveFailed'));
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

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
                {t('hive:equipment.table.addEquipment', {
                  defaultValue: 'Add Equipment',
                })}
              </Button>
            </CardHeader>
            <CardContent className="min-w-0">
              {localTargetHives === 0 && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-warning/30 bg-warning-muted px-3 py-2 text-sm text-warning-foreground">
                  <AlertCircle className="size-4 shrink-0" />
                  {t('hive:equipment.setTargetHint')}
                </div>
              )}
              <div className="overflow-x-auto">
                <EquipmentTable
                  items={plan.data.items}
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
        <ShoppingList items={plan.data.items} />
      </PageAside>
    </PageGrid>
  );
};
