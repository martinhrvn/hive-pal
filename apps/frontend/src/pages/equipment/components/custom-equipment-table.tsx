import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CustomEquipmentItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  extra: number;
  total: number;
  required: number;
  recommended: number;
  needed: number;
  perHive: number;
}

interface CustomEquipmentTableProps {
  customEquipment: CustomEquipmentItem[];
  inventoryCustomEquipment?: Record<string, { extra: number }>;
  onCustomEquipmentExtraChange: (customId: string, value: number) => void;
}

export const CustomEquipmentTable = ({
  customEquipment,
  inventoryCustomEquipment,
  onCustomEquipmentExtraChange,
}: CustomEquipmentTableProps) => {
  if (!customEquipment || customEquipment.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="grid grid-cols-6 gap-4 pb-3 border-b font-semibold text-sm">
        <div>Equipment</div>
        <div className="text-center">Category</div>
        <div className="text-center">Extra</div>
        <div className="text-center">Total</div>
        <div className="text-center">Required</div>
        <div className="text-center">Status</div>
      </div>

      {/* Custom Equipment Rows */}
      {customEquipment.map(item => {
        const surplus = item.total - item.required;
        
        return (
          <div
            key={item.id}
            className="grid grid-cols-6 gap-4 items-center py-2 border-b last:border-0"
          >
            <div className="font-medium">{item.name}</div>
            <div className="text-center flex justify-center">
              <Badge variant="outline" className="text-xs">
                {item.category}
              </Badge>
            </div>
            <div className="text-center flex items-center justify-center">
              <Input
                type="number"
                step="0.1"
                value={inventoryCustomEquipment?.[item.id]?.extra ?? item.extra}
                onChange={e =>
                  onCustomEquipmentExtraChange(
                    item.id,
                    parseFloat(e.target.value) || 0,
                  )
                }
                className="w-20 text-center font-mono text-sm"
              />
              <span className="text-xs text-muted-foreground ml-1">
                {item.unit}
              </span>
            </div>
            <div className="text-center font-mono text-sm">
              {item.total} {item.unit}
            </div>
            <div className="text-center font-mono text-sm">
              {item.required} {item.unit}
            </div>
            <div className="text-center">
              {item.needed > 0 ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="destructive">
                        Need {item.needed} {item.unit}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Recommended: {item.recommended} {item.unit}
                      </p>
                      <p>
                        Per hive: {item.perHive} {item.unit}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : surplus > 0 ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary">
                        +{surplus} {item.unit}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Surplus: {surplus} {item.unit}
                      </p>
                      <p>
                        Recommended: {item.recommended} {item.unit}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Badge variant="secondary">Perfect</Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};