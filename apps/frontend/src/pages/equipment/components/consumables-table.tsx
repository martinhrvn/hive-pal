import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConsumableRowProps {
  name: string;
  unit: string;
  extra: number;
  total: number;
  required: number;
  recommended: number;
  needed: number;
  perHive: number;
  onExtraChange: (value: number) => void;
}

const ConsumableRow = ({
  name,
  unit,
  extra,
  total,
  required,
  recommended,
  needed,
  perHive,
  onExtraChange,
}: ConsumableRowProps) => {
  const surplus = total - required;

  return (
    <div className="grid grid-cols-5 gap-4 items-center py-2 border-b last:border-0">
      <div className="font-medium">{name}</div>
      <div className="text-center flex items-center justify-center">
        <Input
          type="number"
          step="0.1"
          value={extra}
          onChange={e => onExtraChange(parseFloat(e.target.value) || 0)}
          className="w-20 text-center font-mono text-sm"
        />
        <span className="text-xs text-muted-foreground ml-1">{unit}</span>
      </div>
      <div className="text-center font-mono text-sm">
        {total} {unit}
      </div>
      <div className="text-center font-mono text-sm">
        {required} {unit}
      </div>
      <div className="text-center">
        {needed > 0 ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="destructive">
                  Need {needed} {unit}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Recommended: {recommended} {unit}</p>
                <p>Per hive: {perHive} {unit}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : surplus > 0 ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary">
                  +{surplus} {unit}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Surplus: {surplus} {unit}</p>
                <p>Recommended: {recommended} {unit}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Badge variant="secondary">Perfect</Badge>
        )}
      </div>
    </div>
  );
};

interface ConsumablesTableProps {
  consumables: {
    sugar?: {
      name: string;
      unit: string;
      total: number;
      required: number;
      recommended: number;
      needed: number;
      perHive: number;
    };
    syrup?: {
      name: string;
      unit: string;
      total: number;
      required: number;
      recommended: number;
      needed: number;
      perHive: number;
    };
  };
  extraSugarKg: number;
  extraSyrupLiters: number;
  onConsumableExtraChange: (type: 'sugar' | 'syrup', value: number) => void;
}

export const ConsumablesTable = ({
  consumables,
  extraSugarKg,
  extraSyrupLiters,
  onConsumableExtraChange,
}: ConsumablesTableProps) => {
  if (!consumables?.sugar && !consumables?.syrup) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="grid grid-cols-5 gap-4 pb-3 border-b font-semibold text-sm">
        <div>Consumable</div>
        <div className="text-center">Extra</div>
        <div className="text-center">Total</div>
        <div className="text-center">Required</div>
        <div className="text-center">Status</div>
      </div>

      {/* Sugar Row */}
      {consumables.sugar && (
        <ConsumableRow
          name={consumables.sugar.name}
          unit={consumables.sugar.unit}
          extra={extraSugarKg}
          total={consumables.sugar.total}
          required={consumables.sugar.required}
          recommended={consumables.sugar.recommended}
          needed={consumables.sugar.needed}
          perHive={consumables.sugar.perHive}
          onExtraChange={(value) => onConsumableExtraChange('sugar', value)}
        />
      )}

      {/* Syrup Row */}
      {consumables.syrup && (
        <ConsumableRow
          name={consumables.syrup.name}
          unit={consumables.syrup.unit}
          extra={extraSyrupLiters}
          total={consumables.syrup.total}
          required={consumables.syrup.required}
          recommended={consumables.syrup.recommended}
          needed={consumables.syrup.needed}
          perHive={consumables.syrup.perHive}
          onExtraChange={(value) => onConsumableExtraChange('syrup', value)}
        />
      )}
    </div>
  );
};