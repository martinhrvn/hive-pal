import { useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  DAMAGE_TRACKING_CATEGORIES,
  EXTRACTION_TRACKING_CATEGORIES,
  EquipmentScope,
  type EquipmentItemWithCalculations,
  type UpdateEquipmentItem,
} from 'shared-schemas';
import { useTranslation } from 'react-i18next';
import { ROW_GRID } from './equipment-categories';
import { EquipmentStatusBadge } from './equipment-status-badge';
import { getDisplayName, round2, toEditData } from './equipment-utils';
import { NeededInfo } from './needed-info';
import { QuantityInput } from './quantity-input';

interface EquipmentRowEditorProps {
  item: EquipmentItemWithCalculations;
  isUpdating: boolean;
  /** Rejects when saving fails; the editor then stays open. */
  onSave: (data: UpdateEquipmentItem) => Promise<void>;
  onCancel: () => void;
}

/** Inline edit form for one equipment row. Mounted fresh for every edit. */
export function EquipmentRowEditor({
  item,
  isUpdating,
  onSave,
  onCancel,
}: Readonly<EquipmentRowEditorProps>) {
  const { t } = useTranslation(['hive', 'common']);
  const [draft, setDraft] = useState(() => toEditData(item));
  const update = (patch: UpdateEquipmentItem) =>
    setDraft(prev => ({ ...prev, ...patch }));

  const unit = draft.unit ?? item.unit;
  const isShared = draft.scope === EquipmentScope.SHARED;
  const isOverridden = item.neededOverride !== null;

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await onSave(draft);
    } catch {
      // The caller reports the failure; keep the form open for another try.
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(ROW_GRID, 'items-start rounded-md bg-muted/20 px-3 py-3')}
    >
      {/* Name, scope, unit */}
      <div className="space-y-2">
        {item.isCustom ? (
          <Input
            value={draft.name ?? ''}
            onChange={e => update({ name: e.target.value })}
            className="text-sm font-medium"
            aria-label={t('hive:equipment.table.namePlaceholder')}
            placeholder={t('hive:equipment.table.namePlaceholder')}
          />
        ) : (
          <div className="text-sm font-medium">{getDisplayName(item)}</div>
        )}
        <Select
          value={draft.scope ?? EquipmentScope.PER_HIVE}
          onValueChange={v => update({ scope: v as EquipmentScope })}
        >
          <SelectTrigger
            className="h-7 text-xs"
            aria-label={t('hive:equipment.table.scope')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EquipmentScope.PER_HIVE}>
              {t('hive:equipment.table.scopePerHive')}
            </SelectItem>
            <SelectItem value={EquipmentScope.SHARED}>
              {t('hive:equipment.table.scopeShared')}
            </SelectItem>
          </SelectContent>
        </Select>
        {item.isCustom && (
          <Input
            value={draft.unit ?? ''}
            onChange={e => update({ unit: e.target.value })}
            className="text-xs"
            aria-label={t('hive:equipment.table.unit')}
            placeholder={t('hive:equipment.table.unit')}
          />
        )}
      </div>

      <div className="pt-2 text-center text-sm">{round2(item.inUse ?? 0)}</div>

      <div className="flex justify-center pt-1">
        <QuantityInput
          value={draft.perHive}
          onChange={perHive => update({ perHive })}
          unit={unit}
          label={t('hive:equipment.table.perHive')}
        />
      </div>

      {/* Inventory */}
      <div className="flex flex-col items-center space-y-1">
        <QuantityInput
          value={draft.extra}
          onChange={extra => update({ extra })}
          unit={unit}
          label={t('hive:equipment.table.inStorage')}
          placeholder={t('hive:equipment.table.storagePlaceholder')}
        />
        {EXTRACTION_TRACKING_CATEGORIES.has(item.category) && (
          <QuantityInput
            value={draft.inExtraction}
            onChange={inExtraction => update({ inExtraction })}
            unit={unit}
            label={t('hive:equipment.table.extractingPlaceholder')}
            placeholder={t('hive:equipment.table.extractingPlaceholder')}
            className="text-warning-foreground"
          />
        )}
        {DAMAGE_TRACKING_CATEGORIES.has(item.category) && (
          <QuantityInput
            value={draft.damaged}
            onChange={damaged => update({ damaged })}
            unit={unit}
            label={t('hive:equipment.table.damagedPlaceholder')}
            placeholder={t('hive:equipment.table.damagedPlaceholder')}
            className="text-destructive"
          />
        )}
      </div>

      {/* Needed override */}
      <div className="flex items-center justify-center gap-1 pt-1">
        <QuantityInput
          value={draft.neededOverride ?? item.needed}
          onChange={neededOverride => update({ neededOverride })}
          unit={unit}
          label={t('hive:equipment.table.needed')}
          className={cn(isOverridden && 'font-medium text-info-foreground')}
        />
        <NeededInfo
          recommended={item.recommended ?? 0}
          note={
            isShared
              ? t('hive:equipment.table.fixedTargetShared')
              : t('hive:equipment.table.basedOnPerHive', {
                  value: round2(draft.perHive ?? item.perHive),
                })
          }
        />
      </div>

      <div className="pt-1 text-center">
        <EquipmentStatusBadge item={item} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-1 pt-1">
        <Button
          type="submit"
          size="icon"
          className="size-8"
          disabled={isUpdating}
          aria-label={t('common:actions.save')}
        >
          {isUpdating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="size-8"
          onClick={onCancel}
          disabled={isUpdating}
          aria-label={t('common:actions.cancel')}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </form>
  );
}
