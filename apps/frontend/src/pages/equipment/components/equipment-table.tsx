import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, RotateCcw, Edit2, Save, X, Trash2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { EquipmentItemWithCalculations, EquipmentCategory, UpdateEquipmentItem, CreateEquipmentItem } from 'shared-schemas';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
}

export const EquipmentRow = ({
  item,
  onExtraChange: _onExtraChange,
  onPerHiveChange: _onPerHiveChange,
  onNeededChange: _onNeededChange,
  onResetNeeded,
  onUpdate,
  onDelete,
  isUpdating = false,
  isDeleting = false,
}: EquipmentRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editData, setEditData] = useState<UpdateEquipmentItem>({
    name: item.name,
    perHive: item.perHive,
    extra: item.extra,
    neededOverride: item.neededOverride,
    unit: item.unit,
  });

  const handleEdit = () => {
    setEditData({
      name: item.name,
      perHive: item.perHive,
      extra: item.extra,
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
      // Error handling is done by parent component
      console.error('Failed to update equipment item:', error);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: item.name,
      perHive: item.perHive,
      extra: item.extra,
      neededOverride: item.neededOverride,
      unit: item.unit,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      await onDelete();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete equipment item:', error);
    }
  };
  const {
    name,
    itemId,
    inUse = 0,
    extra = 0,
    total = 0,
    needed = 0,
    recommended = 0,
    toPurchase = 0,
    neededOverride,
    perHive,
    unit,
    enabled
  } = item;
  
  const displayName = name || itemId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  const isOverridden = neededOverride !== null;
  const hasSurplus = toPurchase < 0;
  const needsToPurchase = toPurchase > 0;
  
  if (!enabled) return null;

  if (isEditing) {
    return (
      <div className="grid grid-cols-7 gap-4 items-center py-3 bg-muted/20 rounded-md px-3">
        <div className="space-y-1">
          {item.isCustom ? (
            <Input
              value={editData.name || ''}
              onChange={e => setEditData(prev => ({ ...prev, name: e.target.value }))}
              className="text-sm font-medium"
              placeholder="Equipment name"
            />
          ) : (
            <div className="font-medium">{displayName}</div>
          )}
          {item.isCustom ? (
            <Input
              value={editData.unit || ''}
              onChange={e => setEditData(prev => ({ ...prev, unit: e.target.value }))}
              className="text-xs"
              placeholder="Unit"
            />
          ) : (
            <span className="text-xs text-muted-foreground">({unit})</span>
          )}
        </div>
        <div className="text-center text-sm">{inUse}</div>
        <div className="text-center flex justify-center">
          <Input
            type="number"
            value={editData.perHive}
            onChange={e => setEditData(prev => ({ ...prev, perHive: parseFloat(e.target.value) || 0 }))}
            className="w-20 text-center"
            min="0"
            step="0.1"
          />
        </div>
        <div className="text-center flex justify-center">
          <Input
            type="number"
            value={editData.extra}
            onChange={e => setEditData(prev => ({ ...prev, extra: parseInt(e.target.value) || 0 }))}
            className="w-20 text-center"
            min="0"
          />
        </div>
        <div className="text-center flex items-center justify-center gap-1">
          <Input
            type="number"
            value={editData.neededOverride ?? needed}
            onChange={e => setEditData(prev => ({ ...prev, neededOverride: parseInt(e.target.value) || 0 }))}
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
                  Based on {editData.perHive} per hive
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="text-center">
          {needsToPurchase ? (
            <Badge variant="destructive">Need {toPurchase}</Badge>
          ) : hasSurplus ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="cursor-help">
                    +{Math.abs(toPurchase)} surplus
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Surplus: {Math.abs(toPurchase)} extra</p>
                  <p className="text-xs text-muted-foreground">
                    Total: {total} (In use: {inUse} + Extra: {extra})
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Badge variant="outline">Exact</Badge>
          )}
        </div>
        <div className="flex items-center justify-center gap-1">
          <Button
            size="icon"
            variant="default"
            className="h-8 w-8"
            onClick={handleSave}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-3 w-3" />
            )}
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={handleCancel}
            disabled={isUpdating}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-4 items-center py-3 hover:bg-muted/10 rounded-md px-3">
      <div className="font-medium flex items-center gap-2">
        {displayName}
        <span className="text-xs text-muted-foreground">({unit})</span>
      </div>
      <div className="text-center">{inUse}</div>
      <div className="text-center">{perHive}</div>
      <div className="text-center">{extra}</div>
      <div className="text-center flex items-center justify-center gap-1">
        <span className={cn(
          isOverridden && 'text-blue-600 font-medium',
        )}>
          {needed}
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Recommended: {recommended}</p>
              <p className="text-xs text-muted-foreground">
                Based on {perHive} per hive
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {isOverridden && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={onResetNeeded}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>
      <div className="text-center">
        {needsToPurchase ? (
          <Badge variant="destructive">Need {toPurchase}</Badge>
        ) : hasSurplus ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="cursor-help">
                  +{Math.abs(toPurchase)} surplus
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Surplus: {Math.abs(toPurchase)} extra</p>
                <p className="text-xs text-muted-foreground">
                  Total: {total} (In use: {inUse} + Extra: {extra})
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Badge variant="outline">Exact</Badge>
        )}
      </div>
      <div className="flex items-center justify-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleEdit}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
        {item.isCustom && onDelete && (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Equipment Item</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete "{displayName}"? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleDelete} variant="destructive" disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
}: EquipmentTableProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
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

  const handleAddEquipment = () => {
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
    setShowAddForm(true);
  };

  const handleSaveNewItem = async () => {
    if (!onCreate || !newItemData.name?.trim()) {
      return;
    }

    // Create itemId from name if not provided
    const itemId = newItemData.itemId?.trim() || newItemData.name.toLowerCase().replace(/\s+/g, '_');
    
    try {
      await onCreate({
        ...newItemData,
        itemId,
        name: newItemData.name.trim(),
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create equipment item:', error);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
  };

  // Group items by category for better organization
  const categorizedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<EquipmentCategory, EquipmentItemWithCalculations[]>);
  
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
    <div className="space-y-6">
      {/* Add Equipment Button */}
      {onCreate && (
        <div className="flex justify-end">
          <Button
            onClick={handleAddEquipment}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Equipment
          </Button>
        </div>
      )}

      {/* Add Equipment Form */}
      {showAddForm && (
        <div className="bg-muted/20 rounded-md p-4 border-2 border-dashed border-muted-foreground/25">
          <div className="grid grid-cols-7 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs font-medium">Equipment Name</label>
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
                onChange={e => setNewItemData(prev => ({ ...prev, perHive: parseFloat(e.target.value) || 0 }))}
                className="w-20 text-center"
                min="0"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Extra</label>
              <Input
                type="number"
                value={newItemData.extra}
                onChange={e => setNewItemData(prev => ({ ...prev, extra: parseInt(e.target.value) || 0 }))}
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
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelAdd}
                disabled={isCreating}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table Header */}
      <div className="grid grid-cols-7 gap-4 pb-3 border-b font-semibold text-sm">
        <div>Equipment</div>
        <div className="text-center">In Use</div>
        <div className="text-center">Per Hive</div>
        <div className="text-center">Extra</div>
        <div className="text-center">Needed</div>
        <div className="text-center">Status</div>
        <div className="text-center">Actions</div>
      </div>

      {categoryOrder.map(category => {
        const categoryItems = categorizedItems[category];
        if (!categoryItems || categoryItems.length === 0) return null;
        
        return (
          <div key={category} className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground capitalize">
              {category.toLowerCase().replace('_', ' ')}
            </h3>
            {categoryItems
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map(item => (
                <EquipmentRow
                  key={item.itemId}
                  item={item}
                  onExtraChange={(value) => onExtraChange(item.itemId, value)}
                  onPerHiveChange={(value) => onPerHiveChange(item.itemId, value)}
                  onNeededChange={(value) => onNeededChange(item.itemId, value)}
                  onResetNeeded={() => onResetNeeded(item.itemId)}
                  onUpdate={onUpdate ? (data) => onUpdate(item.itemId, data) : undefined}
                  onDelete={onDelete ? () => onDelete(item.itemId) : undefined}
                  isUpdating={updatingItems.has(item.itemId)}
                  isDeleting={deletingItems.has(item.itemId)}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
};