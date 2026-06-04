import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Info, RotateCcw, Edit2, Save, X, Trash2, Eye,
  Box, Home, LayoutGrid, Droplets, FlaskConical,
  Wrench, Shield, Container, Star,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  EquipmentItemWithCalculations,
  EquipmentCategory,
  EquipmentScope,
  UpdateEquipmentItem,
  CreateEquipmentItem,
  EXTRACTION_TRACKING_CATEGORIES,
  DAMAGE_TRACKING_CATEGORIES,
  SHARED_SCOPE_CATEGORIES,
} from 'shared-schemas';
import { useState } from 'react';
import { DeleteConfirmDialog } from '@/components/common/delete-confirm-dialog';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
import { useTranslation } from 'react-i18next';

/** Round to 2 decimal places to avoid floating point display noise. */
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Pieces-based units are always whole numbers; weight/volume can be fractional. */
function getInputProps(unit: string): { step: string; parse: (v: string) => number } {
  const fractionalUnits = new Set(['kg', 'g', 'liters', 'l', 'ml', 'oz', 'lb']);
  const isFractional = fractionalUnits.has(unit.toLowerCase());
  return {
    step: isFractional ? '0.5' : '1',
    parse: isFractional ? v => parseFloat(v) || 0 : v => parseInt(v) || 0,
  };
}

interface EquipmentRowProps {
  item: EquipmentItemWithCalculations;
  onExtraChange: (value: number) => void;
  onPerHiveChange: (value: number) => void;
  onNeededChange: (value: number) => void;
  onResetNeeded: () => void;
  onUpdate?: (data: UpdateEquipmentItem) => Promise<void>;
  onDelete?: () => Promise<void>;
  isUpdating?: boolean;
  isDeleting?: boolean;
  compact?: boolean;
}

export const EquipmentRow = ({
  item,
  onResetNeeded,
  onUpdate,
  onDelete,
  isUpdating = false,
  isDeleting = false,
  compact = false,
}: EquipmentRowProps) => {
  const { t } = useTranslation('hive');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UpdateEquipmentItem>({
    name: item.name,
    scope: item.scope,
    perHive: item.perHive,
    extra: item.extra,
    inExtraction: item.inExtraction ?? 0,
    damaged: item.damaged ?? 0,
    neededOverride: item.neededOverride,
    unit: item.unit,
  });

  const isShared = item.scope === EquipmentScope.SHARED;
  const hasExtractionTracking = EXTRACTION_TRACKING_CATEGORIES.has(item.category);
  const hasDamageTracking = DAMAGE_TRACKING_CATEGORIES.has(item.category);

  // Delete/hide logic depends on whether item is custom
  const handleDeleteOrHide = async () => {
    if (item.isCustom && onDelete) {
      await onDelete();
    } else if (onUpdate) {
      await onUpdate({ enabled: false });
    }
  };

  const deleteDialog = useDeleteDialog(handleDeleteOrHide);

  const handleEdit = () => {
    setEditData({
      name: item.name,
      scope: item.scope,
      perHive: item.perHive,
      extra: item.extra,
      inExtraction: item.inExtraction ?? 0,
      damaged: item.damaged ?? 0,
      neededOverride: item.neededOverride,
      unit: item.unit,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!onUpdate) return;
    try {
      await onUpdate(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update equipment item:', error);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: item.name,
      scope: item.scope,
      perHive: item.perHive,
      extra: item.extra,
      inExtraction: item.inExtraction ?? 0,
      damaged: item.damaged ?? 0,
      neededOverride: item.neededOverride,
      unit: item.unit,
    });
    setIsEditing(false);
  };

  const {
    name,
    itemId,
    inUse = 0,
    extra = 0,
    inExtraction = 0,
    damaged = 0,
    total = 0,
    needed = 0,
    recommended = 0,
    toPurchase = 0,
    neededOverride,
    perHive,
    unit,
    enabled,
  } = item;

  const displayName =
    name ||
    itemId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  const isOverridden = neededOverride !== null;
  const hasSurplus = toPurchase < 0;
  const needsToPurchase = toPurchase > 0;

  if (!enabled && !compact) return null;

  if (isEditing) {
    const editIsShared = editData.scope === EquipmentScope.SHARED;
    return (
      <div className="grid grid-cols-7 gap-4 items-start py-3 bg-muted/20 rounded-md px-3">
        {/* Name + scope */}
        <div className="space-y-2">
          {item.isCustom ? (
            <Input
              value={editData.name || ''}
              onChange={e => setEditData(prev => ({ ...prev, name: e.target.value }))}
              className="text-sm font-medium"
              placeholder="Equipment name"
            />
          ) : (
            <div className="font-medium text-sm">{displayName}</div>
          )}
          <Select
            value={editData.scope ?? EquipmentScope.PER_HIVE}
            onValueChange={(v: EquipmentScope) =>
              setEditData(prev => ({ ...prev, scope: v }))
            }
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EquipmentScope.PER_HIVE}>Per hive</SelectItem>
              <SelectItem value={EquipmentScope.SHARED}>Shared</SelectItem>
            </SelectContent>
          </Select>
          {item.isCustom && (
            <Input
              value={editData.unit || ''}
              onChange={e => setEditData(prev => ({ ...prev, unit: e.target.value }))}
              className="text-xs"
              placeholder="Unit"
            />
          )}
        </div>

        {/* In use (read-only) */}
        <div className="text-center text-sm pt-2">{round2(inUse)}</div>

        {/* Per hive / target */}
        <div className="text-center flex justify-center pt-1">
          {(() => {
            const { step, parse } = getInputProps(editData.unit ?? item.unit);
            return (
              <Input
                type="number"
                value={editData.perHive}
                onChange={e => setEditData(prev => ({ ...prev, perHive: parse(e.target.value) }))}
                className="w-20 text-center"
                min="0"
                step={step}
              />
            );
          })()}
        </div>

        {/* In storage / extra */}
        <div className="space-y-1">
          <Input
            type="number"
            value={editData.extra}
            onChange={e =>
              setEditData(prev => ({ ...prev, extra: parseInt(e.target.value) || 0 }))
            }
            className="w-20 text-center mx-auto block"
            min="0"
            placeholder="Storage"
          />
          {hasExtractionTracking && (
            <Input
              type="number"
              value={editData.inExtraction}
              onChange={e =>
                setEditData(prev => ({ ...prev, inExtraction: parseInt(e.target.value) || 0 }))
              }
              className="w-20 text-center mx-auto block text-amber-600"
              min="0"
              placeholder="Extracting"
            />
          )}
          {hasDamageTracking && (
            <Input
              type="number"
              value={editData.damaged}
              onChange={e =>
                setEditData(prev => ({ ...prev, damaged: parseInt(e.target.value) || 0 }))
              }
              className="w-20 text-center mx-auto block text-red-500"
              min="0"
              placeholder="Damaged"
            />
          )}
        </div>

        {/* Needed override */}
        <div className="text-center flex items-center justify-center gap-1 pt-1">
          <Input
            type="number"
            value={editData.neededOverride ?? needed}
            onChange={e =>
              setEditData(prev => ({ ...prev, neededOverride: parseInt(e.target.value) || 0 }))
            }
            className={cn('w-20 text-center', isOverridden && 'text-blue-600 font-medium')}
            min="0"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Recommended: {round2(recommended)}</p>
                <p className="text-xs text-muted-foreground">
                  {editIsShared
                    ? 'Fixed target (shared equipment)'
                    : `Based on ${round2(editData.perHive ?? perHive)} per hive`}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Status badge */}
        <div className="text-center pt-1">
          {needsToPurchase ? (
            <Badge variant="destructive">Need {round2(toPurchase)}</Badge>
          ) : hasSurplus ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="cursor-help">
                    +{round2(Math.abs(toPurchase))} surplus
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Surplus: {round2(Math.abs(toPurchase))} extra</p>
                  <p className="text-xs text-muted-foreground">
                    Total usable: {round2(total)} (on hives: {round2(inUse)}, stored: {round2(extra)}
                    {inExtraction > 0 ? `, extracting: ${round2(inExtraction)}` : ''})
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Badge variant="outline">Exact</Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-1 pt-1">
          <Button size="icon" variant="default" className="h-8 w-8" onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-3 w-3" />
            )}
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleCancel} disabled={isUpdating}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-4 items-center py-3 hover:bg-muted/10 rounded-md px-3">
      {/* Name + scope badge */}
      <div className="flex flex-col gap-1">
        <div className="font-medium flex items-center gap-2">
          {displayName}
          <span className="text-xs text-muted-foreground">({unit})</span>
        </div>
        {isShared && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground italic cursor-default">shared</span>
              </TooltipTrigger>
              <TooltipContent>
                Target doesn't multiply by hive count — one fixed amount for the whole apiary
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* In use */}
      <div className="text-center">{round2(inUse)}</div>

      {/* Per hive / target */}
      <div className="text-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-default">{round2(perHive)}</span>
            </TooltipTrigger>
            <TooltipContent>
              {isShared ? 'Fixed target count (shared equipment)' : `${round2(perHive)} per hive`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Storage / status */}
      <div className="text-center">
        {(hasExtractionTracking || hasDamageTracking) ? (
          <div className="flex flex-col items-center gap-0.5 text-xs">
            <span>{round2(extra)} stored</span>
            {hasExtractionTracking && inExtraction > 0 && (
              <span className="text-amber-600">{round2(inExtraction)} extracting</span>
            )}
            {hasDamageTracking && damaged > 0 && (
              <span className="text-red-500">{round2(damaged)} damaged</span>
            )}
          </div>
        ) : (
          <span>{round2(extra)}</span>
        )}
      </div>

      {/* Needed */}
      <div className="text-center flex items-center justify-center gap-1">
        <span className={cn(isOverridden && 'text-blue-600 font-medium')}>{round2(needed)}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Recommended: {round2(recommended)}</p>
              <p className="text-xs text-muted-foreground">
                {isShared ? 'Fixed target' : `Based on ${round2(perHive)} per hive`}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {isOverridden && (
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onResetNeeded}>
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Status */}
      <div className="text-center">
        {needsToPurchase ? (
          <Badge variant="destructive">Need {round2(toPurchase)}</Badge>
        ) : hasSurplus ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="cursor-help">
                  +{round2(Math.abs(toPurchase))} surplus
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Surplus: {round2(Math.abs(toPurchase))} extra</p>
                <p className="text-xs text-muted-foreground">
                  Total usable: {round2(total)} (on hives: {round2(inUse)}, stored: {round2(extra)}
                  {inExtraction > 0 ? `, extracting: ${round2(inExtraction)}` : ''})
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Badge variant="outline">Exact</Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleEdit}>
          <Edit2 className="h-3 w-3" />
        </Button>
        {(item.isCustom ? onDelete : onUpdate) && (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-1 text-red-600 hover:text-red-700 hover:bg-red-100"
              onClick={deleteDialog.open}
              disabled={isDeleting || isUpdating}
            >
              {isDeleting ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>

            <DeleteConfirmDialog
              open={deleteDialog.isOpen}
              onOpenChange={(open) => !open && deleteDialog.close()}
              onConfirm={deleteDialog.handleDelete}
              isPending={deleteDialog.isPending || isDeleting || isUpdating}
              title={
                item.isCustom
                  ? t('hive:equipment.table.deleteItem', { defaultValue: 'Delete Equipment Item' })
                  : t('hive:equipment.table.hideItem', { defaultValue: 'Hide Equipment Item' })
              }
              description={
                item.isCustom
                  ? t('hive:equipment.table.deleteConfirm', { name: displayName, defaultValue: `Are you sure you want to delete "${displayName}"? This action cannot be undone.` })
                  : t('hive:equipment.table.hideConfirm', { name: displayName, defaultValue: `This will hide "${displayName}" from your equipment list. You can restore it later.` })
              }
            />
          </>
        )}
      </div>
    </div>
  );
};

interface EquipmentTableProps {
  items: EquipmentItemWithCalculations[];
  onExtraChange: (itemId: string, value: number) => void;
  onPerHiveChange: (itemId: string, value: number) => void;
  onNeededChange: (itemId: string, value: number) => void;
  onResetNeeded: (itemId: string) => void;
  onUpdate?: (itemId: string, data: UpdateEquipmentItem) => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
  onCreate?: (data: CreateEquipmentItem) => Promise<void>;
  updatingItems?: Set<string>;
  deletingItems?: Set<string>;
  isCreating?: boolean;
  showAddForm?: boolean;
  onShowAddFormChange?: (show: boolean) => void;
}

export const EquipmentTable = ({
  items,
  onExtraChange,
  onPerHiveChange,
  onNeededChange,
  onResetNeeded,
  onUpdate,
  onDelete,
  onCreate,
  updatingItems = new Set(),
  deletingItems = new Set(),
  isCreating = false,
  showAddForm: showAddFormProp,
  onShowAddFormChange,
}: EquipmentTableProps) => {
  const { t } = useTranslation('hive');
  const [showAddFormLocal, setShowAddFormLocal] = useState(false);
  const showAddForm = showAddFormProp ?? showAddFormLocal;
  const setShowAddForm = (v: boolean) => {
    if (v) {
      setNewItemData({
        itemId: '',
        name: '',
        category: EquipmentCategory.CUSTOM,
        unit: 'pieces',
        perHive: 0,
        extra: 0,
        enabled: true,
        displayOrder: 999,
      });
    }
    setShowAddFormLocal(v);
    onShowAddFormChange?.(v);
  };
  const [showHidden, setShowHidden] = useState(false);

  const [newItemData, setNewItemData] = useState<CreateEquipmentItem>({
    itemId: '',
    name: '',
    category: EquipmentCategory.CUSTOM,
    unit: 'pieces',
    perHive: 0,
    extra: 0,
    enabled: true,
    displayOrder: 999,
  });

  const handleSaveNewItem = async () => {
    if (!onCreate || !newItemData.name?.trim()) return;
    const itemId =
      newItemData.itemId?.trim() ||
      newItemData.name.toLowerCase().replace(/\s+/g, '_');
    const defaultScope = SHARED_SCOPE_CATEGORIES.has(newItemData.category)
      ? EquipmentScope.SHARED
      : EquipmentScope.PER_HIVE;
    try {
      await onCreate({ ...newItemData, itemId, name: newItemData.name.trim(), scope: defaultScope });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create equipment item:', error);
    }
  };

  const handleCancelAdd = () => setShowAddForm(false);

  const enabledItems = items.filter(item => item.enabled);
  const hiddenItems = items.filter(item => !item.enabled);

  const categorizedItems = enabledItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<EquipmentCategory, EquipmentItemWithCalculations[]>,
  );

  const CATEGORY_CONFIG: Record<
    EquipmentCategory,
    { label: string; icon: React.ElementType; border: string; header: string; iconColor: string }
  > = {
    [EquipmentCategory.BOXES]:       { label: 'Boxes',        icon: Box,          border: 'border-l-blue-400',    header: 'bg-blue-50/80 dark:bg-blue-950/30',    iconColor: 'text-blue-600' },
    [EquipmentCategory.HIVE_PARTS]:  { label: 'Hive Parts',   icon: Home,         border: 'border-l-slate-400',   header: 'bg-slate-50/80 dark:bg-slate-950/30',  iconColor: 'text-slate-600' },
    [EquipmentCategory.FRAMES]:      { label: 'Frames',       icon: LayoutGrid,   border: 'border-l-amber-400',   header: 'bg-amber-50/80 dark:bg-amber-950/30',  iconColor: 'text-amber-600' },
    [EquipmentCategory.FEEDING]:     { label: 'Feeding',      icon: Droplets,     border: 'border-l-green-400',   header: 'bg-green-50/80 dark:bg-green-950/30',  iconColor: 'text-green-600' },
    [EquipmentCategory.CONSUMABLES]: { label: 'Consumables',  icon: FlaskConical, border: 'border-l-purple-400',  header: 'bg-purple-50/80 dark:bg-purple-950/30', iconColor: 'text-purple-600' },
    [EquipmentCategory.TOOLS]:       { label: 'Tools',        icon: Wrench,       border: 'border-l-orange-400',  header: 'bg-orange-50/80 dark:bg-orange-950/30', iconColor: 'text-orange-600' },
    [EquipmentCategory.PROTECTIVE]:  { label: 'Protective',   icon: Shield,       border: 'border-l-teal-400',    header: 'bg-teal-50/80 dark:bg-teal-950/30',    iconColor: 'text-teal-600' },
    [EquipmentCategory.EXTRACTION]:  { label: 'Extraction',   icon: Container,    border: 'border-l-yellow-400',  header: 'bg-yellow-50/80 dark:bg-yellow-950/30', iconColor: 'text-yellow-600' },
    [EquipmentCategory.CUSTOM]:      { label: 'Custom',       icon: Star,         border: 'border-l-gray-400',    header: 'bg-gray-50/80 dark:bg-gray-950/30',    iconColor: 'text-gray-600' },
  };

  const categoryOrder = [
    EquipmentCategory.BOXES,
    EquipmentCategory.HIVE_PARTS,
    EquipmentCategory.FRAMES,
    EquipmentCategory.FEEDING,
    EquipmentCategory.CONSUMABLES,
    EquipmentCategory.TOOLS,
    EquipmentCategory.PROTECTIVE,
    EquipmentCategory.EXTRACTION,
    EquipmentCategory.CUSTOM,
  ];

  return (
    <div className="space-y-6 min-w-[750px]">
      {showAddForm && (
        <div className="bg-muted/20 rounded-md p-4 border-2 border-dashed border-muted-foreground/25">
          <div className="grid grid-cols-7 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs font-medium">
                {t('hive:equipment.table.equipmentName', { defaultValue: 'Equipment Name' })}
              </label>
              <Input
                value={newItemData.name}
                onChange={e => setNewItemData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Custom Smoker"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">In Use</label>
              <div className="text-sm text-center text-muted-foreground">0</div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Per Hive</label>
              <Input
                type="number"
                value={newItemData.perHive}
                onChange={e => {
                  const { parse } = getInputProps(newItemData.unit ?? 'pieces');
                  setNewItemData(prev => ({ ...prev, perHive: parse(e.target.value) }));
                }}
                className="w-20 text-center"
                min="0"
                step={getInputProps(newItemData.unit ?? 'pieces').step}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">In Storage</label>
              <Input
                type="number"
                value={newItemData.extra}
                onChange={e =>
                  setNewItemData(prev => ({ ...prev, extra: parseInt(e.target.value) || 0 }))
                }
                className="w-20 text-center"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Unit</label>
              <Input
                value={newItemData.unit}
                onChange={e => setNewItemData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="pieces"
                className="text-center"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Category</label>
              <Select
                value={newItemData.category}
                onValueChange={(value: EquipmentCategory) =>
                  setNewItemData(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(EquipmentCategory).map(category => (
                    <SelectItem key={category} value={category} className="text-xs">
                      {category.toLowerCase().replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                onClick={handleSaveNewItem}
                disabled={isCreating || !newItemData.name?.trim()}
                className="gap-1"
              >
                {isCreating ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                {t('hive:equipment.table.save', { defaultValue: 'Save' })}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelAdd} disabled={isCreating}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {categoryOrder.map(category => {
        const categoryItems = categorizedItems[category];
        if (!categoryItems || categoryItems.length === 0) return null;

        const cfg = CATEGORY_CONFIG[category];
        const Icon = cfg.icon;
        const sorted = [...categoryItems].sort((a, b) => a.displayOrder - b.displayOrder);

        return (
          <div
            key={category}
            className={`rounded-lg border border-border border-l-4 ${cfg.border} overflow-hidden`}
          >
            {/* Category header */}
            <div className={`${cfg.header} px-3 py-2 flex items-center gap-2 border-b border-border/50`}>
              <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
              <span className="text-sm font-semibold">{cfg.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {sorted.length} {sorted.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Column sub-header */}
            <div className="grid grid-cols-7 gap-4 px-3 py-1.5 text-xs text-muted-foreground border-b border-border/30 bg-background/60">
              <div>Item</div>
              <div className="text-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-default underline decoration-dotted">In Use</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Currently mounted on your hives
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-center">Per Hive / Target</div>
              <div className="text-center">Inventory</div>
              <div className="text-center">Needed</div>
              <div className="text-center">Status</div>
              <div className="text-center">Actions</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border/30">
              {sorted.map(item => (
                <EquipmentRow
                  key={item.itemId}
                  item={item}
                  onExtraChange={value => onExtraChange(item.itemId, value)}
                  onPerHiveChange={value => onPerHiveChange(item.itemId, value)}
                  onNeededChange={value => onNeededChange(item.itemId, value)}
                  onResetNeeded={() => onResetNeeded(item.itemId)}
                  onUpdate={onUpdate ? data => onUpdate(item.itemId, data) : undefined}
                  onDelete={onDelete ? () => onDelete(item.itemId) : undefined}
                  isUpdating={updatingItems.has(item.itemId)}
                  isDeleting={deletingItems.has(item.itemId)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Hidden items section */}
      {hiddenItems.length > 0 && (
        <div className="pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => setShowHidden(!showHidden)}
          >
            <Eye className="h-4 w-4" />
            {t('hive:equipment.table.showHidden', {
              count: hiddenItems.length,
              defaultValue: 'Show {{count}} hidden item(s)',
            })}
          </Button>
          {showHidden && (
            <div className="mt-3 space-y-2 opacity-60">
              {hiddenItems.map(item => (
                <div
                  key={item.itemId}
                  className="grid grid-cols-7 gap-4 items-center py-2 px-3 rounded-md bg-muted/10"
                >
                  <div className="font-medium text-muted-foreground flex items-center gap-2">
                    {item.name ||
                      item.itemId
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase())}
                    <span className="text-xs">({item.unit})</span>
                  </div>
                  <div className="col-span-5" />
                  <div className="flex justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      disabled={updatingItems.has(item.itemId)}
                      onClick={() => onUpdate?.(item.itemId, { enabled: true })}
                    >
                      <RotateCcw className="h-3 w-3" />
                      {t('hive:equipment.table.restore', { defaultValue: 'Restore' })}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
