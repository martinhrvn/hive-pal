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
import { EquipmentCounts } from '@/api/hooks/useEquipment';

interface EquipmentRowProps {
  label: string;
  inUse: number;
  extra: number;
  total: number;
  required: number;
  recommended: number;
  needed: number;
  onExtraChange: (value: number) => void;
  onRequiredChange: (value: number) => void;
  onResetRequired: () => void;
  targetHives: number;
  perHive: number;
}

export const EquipmentRow = ({
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
  targetHives,
  perHive,
}: EquipmentRowProps) => {
  const isOverridden = required !== recommended;
  const surplus = total - required;
  const hasSurplus = surplus > 0;

  return (
    <div className="grid grid-cols-5 gap-4 items-center py-3">
      <div className="font-medium">{label}</div>
      <div className="text-center">{inUse}</div>
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
          value={required}
          onChange={e => onRequiredChange(parseInt(e.target.value) || 0)}
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
            onClick={onResetRequired}
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

interface EquipmentTableProps {
  equipmentLabels: Record<string, string>;
  planData: any;
  inventoryData: any;
  settings: any;
  onExtraChange: (key: keyof EquipmentCounts, value: number) => void;
  onRequiredChange: (key: keyof EquipmentCounts, value: number) => void;
  onResetRequired: (key: keyof EquipmentCounts) => void;
}

export const EquipmentTable = ({
  equipmentLabels,
  planData,
  inventoryData,
  settings,
  onExtraChange,
  onRequiredChange,
  onResetRequired,
}: EquipmentTableProps) => {
  return (
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
        const perHiveKey = `${equipmentKey}PerHive` as keyof typeof settings.data;
        const perHive = settings.data?.[perHiveKey] || 0;

        return (
          <EquipmentRow
            key={key}
            label={label}
            inUse={planData.inUse[equipmentKey]}
            extra={inventoryData[`extra${equipmentKey.charAt(0).toUpperCase() + equipmentKey.slice(1)}`] as number}
            total={planData.total[equipmentKey]}
            required={planData.required[equipmentKey]}
            recommended={planData.recommended[equipmentKey]}
            needed={planData.needed[equipmentKey]}
            onExtraChange={(value) => onExtraChange(equipmentKey, value)}
            onRequiredChange={(value) => onRequiredChange(equipmentKey, value)}
            onResetRequired={() => onResetRequired(equipmentKey)}
            targetHives={planData.targetHives}
            perHive={perHive}
          />
        );
      })}
    </div>
  );
};