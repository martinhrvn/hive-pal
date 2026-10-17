import { useState } from 'react';
import { Eye, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EquipmentItemWithCalculations } from 'shared-schemas';
import { useTranslation } from 'react-i18next';
import { ROW_GRID } from './equipment-categories';
import { getDisplayName } from './equipment-utils';

interface HiddenEquipmentListProps {
  items: EquipmentItemWithCalculations[];
  updatingItems: ReadonlySet<string>;
  onRestore: (itemId: string) => void;
}

/** Collapsed list of hidden built-in items, each with a restore button. */
export function HiddenEquipmentList({
  items,
  updatingItems,
  onRestore,
}: HiddenEquipmentListProps) {
  const { t } = useTranslation('hive');
  const [isOpen, setIsOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="border-t pt-4">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-muted-foreground"
        onClick={() => setIsOpen(open => !open)}
        aria-expanded={isOpen}
      >
        <Eye className="size-4" />
        {t('hive:equipment.table.showHidden', { count: items.length })}
      </Button>
      {isOpen && (
        <ul className="mt-3 space-y-2 opacity-60">
          {items.map(item => (
            <li
              key={item.itemId}
              className={cn(
                ROW_GRID,
                'items-center rounded-md bg-muted/10 px-3 py-2',
              )}
            >
              <div className="flex items-center gap-2 font-medium text-muted-foreground">
                {getDisplayName(item)}
                <span className="text-xs">({item.unit})</span>
              </div>
              <div className="col-span-5" />
              <div className="flex justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  disabled={updatingItems.has(item.itemId)}
                  onClick={() => onRestore(item.itemId)}
                >
                  <RotateCcw className="size-3.5" />
                  {t('hive:equipment.table.restore')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
