import { useId, useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  EquipmentCategory,
  EquipmentScope,
  SHARED_SCOPE_CATEGORIES,
  type CreateEquipmentItem,
} from 'shared-schemas';
import { useTranslation } from 'react-i18next';
import { ROW_GRID, categoryLabelKey } from './equipment-categories';
import { QuantityInput } from './quantity-input';

const DEFAULT_UNIT = 'pieces';

const EMPTY_ITEM: CreateEquipmentItem = {
  itemId: '',
  name: '',
  category: EquipmentCategory.CUSTOM,
  unit: DEFAULT_UNIT,
  perHive: 0,
  extra: 0,
  enabled: true,
  displayOrder: 999,
};

interface AddEquipmentFormProps {
  isCreating: boolean;
  /** Rejects when creating fails; the form then stays open. */
  onCreate: (data: CreateEquipmentItem) => Promise<void>;
  onClose: () => void;
}

/** New custom equipment row. Mount it only while open so it starts empty. */
export function AddEquipmentForm({
  isCreating,
  onCreate,
  onClose,
}: Readonly<AddEquipmentFormProps>) {
  const { t } = useTranslation(['hive', 'common']);
  const id = useId();
  const [draft, setDraft] = useState(EMPTY_ITEM);
  const update = (patch: Partial<CreateEquipmentItem>) =>
    setDraft(prev => ({ ...prev, ...patch }));

  const name = draft.name?.trim() ?? '';
  const unit = draft.unit || DEFAULT_UNIT;

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name) return;
    try {
      await onCreate({
        ...draft,
        itemId: draft.itemId?.trim() || name.toLowerCase().replace(/\s+/g, '_'),
        name,
        scope: SHARED_SCOPE_CATEGORIES.has(draft.category)
          ? EquipmentScope.SHARED
          : EquipmentScope.PER_HIVE,
      });
      onClose();
    } catch {
      // The caller reports the failure; keep the draft for another try.
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-4"
    >
      <div className={cn(ROW_GRID, 'items-end')}>
        <div className="space-y-2">
          <Label htmlFor={`${id}-name`} className="text-xs">
            {t('hive:equipment.table.equipmentName')}
          </Label>
          <Input
            id={`${id}-name`}
            value={draft.name}
            onChange={e => update({ name: e.target.value })}
            placeholder={t('hive:equipment.table.namePlaceholderExample')}
            className="text-sm"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-medium">
            {t('hive:equipment.table.inUse')}
          </span>
          <div className="text-center text-sm text-muted-foreground">0</div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-per-hive`} className="text-xs">
            {t('hive:equipment.table.perHive')}
          </Label>
          <QuantityInput
            id={`${id}-per-hive`}
            value={draft.perHive}
            onChange={perHive => update({ perHive })}
            unit={unit}
            label={t('hive:equipment.table.perHive')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-extra`} className="text-xs">
            {t('hive:equipment.table.inStorage')}
          </Label>
          <QuantityInput
            id={`${id}-extra`}
            value={draft.extra}
            onChange={extra => update({ extra })}
            unit={unit}
            label={t('hive:equipment.table.inStorage')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-unit`} className="text-xs">
            {t('hive:equipment.table.unit')}
          </Label>
          <Input
            id={`${id}-unit`}
            value={draft.unit}
            onChange={e => update({ unit: e.target.value })}
            placeholder={t('hive:equipment.table.unitPlaceholder')}
            className="text-center"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-category`} className="text-xs">
            {t('hive:equipment.table.category')}
          </Label>
          <Select
            value={draft.category}
            onValueChange={value =>
              update({ category: value as EquipmentCategory })
            }
          >
            <SelectTrigger id={`${id}-category`} className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(EquipmentCategory).map(category => (
                <SelectItem key={category} value={category} className="text-xs">
                  {t(categoryLabelKey(category))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-1">
          <Button
            type="submit"
            size="sm"
            disabled={isCreating || !name}
            className="gap-1"
          >
            {isCreating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            {t('hive:equipment.table.save')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onClose}
            disabled={isCreating}
            aria-label={t('common:actions.cancel')}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>
    </form>
  );
}
