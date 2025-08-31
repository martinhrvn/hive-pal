import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, RotateCcw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { EquipmentItemWithCalculations, EquipmentCategory } from 'shared-schemas';

interface EquipmentRowProps {
  item: EquipmentItemWithCalculations;
  onExtraChange: (value: number) => void;
  onPerHiveChange: (value: number) => void;
  onNeededChange: (value: number) => void;
  onResetNeeded: () => void;
}

export const EquipmentRow = ({
  item,
  onExtraChange,
  onPerHiveChange,
  onNeededChange,
  onResetNeeded,
}: EquipmentRowProps) => {
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

  return (
    <div className="grid grid-cols-6 gap-4 items-center py-3">
      <div className="font-medium flex items-center gap-2">
        {displayName}
        <span className="text-xs text-muted-foreground">({unit})</span>
      </div>
      <div className="text-center">{inUse}</div>
      <div className="text-center flex justify-center">
        <Input
          type="number"
          value={perHive}
          onChange={e => onPerHiveChange(parseFloat(e.target.value) || 0)}
          className="w-20 text-center"
          min="0"
          step="0.1"
        />
      </div>
      <div className="text-center flex justify-center">
        <Input
          type="number"
          value={extra}
          onChange={e => onExtraChange(parseInt(e.target.value) || 0)}
          className="w-20 text-center"
          min="0"
        />
      </div>
      <div className="text-center flex items-center justify-center gap-1">
        <Input
          type="number"
          value={needed}
          onChange={e => onNeededChange(parseInt(e.target.value) || 0)}
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
    </div>
  );
};

interface EquipmentTableProps {
  items: EquipmentItemWithCalculations[];
  onExtraChange: (itemId: string, value: number) => void;
  onPerHiveChange: (itemId: string, value: number) => void;
  onNeededChange: (itemId: string, value: number) => void;
  onResetNeeded: (itemId: string) => void;
}

export const EquipmentTable = ({
  items,
  onExtraChange,
  onPerHiveChange,
  onNeededChange,
  onResetNeeded,
}: EquipmentTableProps) => {
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
      {/* Table Header */}
      <div className="grid grid-cols-6 gap-4 pb-3 border-b font-semibold text-sm">
        <div>Equipment</div>
        <div className="text-center">In Use</div>
        <div className="text-center">Per Hive</div>
        <div className="text-center">Extra</div>
        <div className="text-center">Needed</div>
        <div className="text-center">Status</div>
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
                />
              ))}
          </div>
        );
      })}
    </div>
  );
};