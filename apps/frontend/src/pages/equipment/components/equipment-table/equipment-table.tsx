import { useState } from 'react';
import type {
  CreateEquipmentItem,
  EquipmentCategory,
  EquipmentItemWithCalculations,
  UpdateEquipmentItem,
} from 'shared-schemas';
import { useTranslation } from 'react-i18next';
import { DeleteConfirmDialog } from '@/components/common/delete-confirm-dialog';
import { AddEquipmentForm } from './add-equipment-form';
import { CATEGORY_ORDER } from './equipment-categories';
import { EquipmentCategorySection } from './equipment-category-section';
import { EquipmentRow } from './equipment-row';
import { EquipmentRowEditor } from './equipment-row-editor';
import { getDisplayName } from './equipment-utils';
import { HiddenEquipmentList } from './hidden-equipment-list';

interface EquipmentTableProps {
  items: EquipmentItemWithCalculations[];
  /** Mutations reject on failure so inline forms can stay open. */
  onUpdate: (itemId: string, data: UpdateEquipmentItem) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  onCreate: (data: CreateEquipmentItem) => Promise<void>;
  updatingItems: ReadonlySet<string>;
  deletingItems: ReadonlySet<string>;
  isCreating: boolean;
  showAddForm: boolean;
  onShowAddFormChange: (show: boolean) => void;
}

function groupByCategory(items: EquipmentItemWithCalculations[]) {
  const groups = new Map<EquipmentCategory, EquipmentItemWithCalculations[]>();
  for (const item of items) {
    const group = groups.get(item.category) ?? [];
    group.push(item);
    groups.set(item.category, group);
  }
  for (const group of groups.values()) {
    group.sort((a, b) => a.displayOrder - b.displayOrder);
  }
  return groups;
}

export function EquipmentTable({
  items,
  onUpdate,
  onDelete,
  onCreate,
  updatingItems,
  deletingItems,
  isCreating,
  showAddForm,
  onShowAddFormChange,
}: EquipmentTableProps) {
  const { t } = useTranslation('hive');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<EquipmentItemWithCalculations>();

  const groups = groupByCategory(items.filter(item => item.enabled));
  const hiddenItems = items.filter(item => !item.enabled);

  const saveEdit = async (itemId: string, data: UpdateEquipmentItem) => {
    await onUpdate(itemId, data);
    setEditingId(null);
  };

  // Custom items are deleted; built-in items can only be hidden.
  const confirmRemove = async () => {
    if (!removing) return;
    try {
      if (removing.isCustom) {
        await onDelete(removing.itemId);
      } else {
        await onUpdate(removing.itemId, { enabled: false });
      }
      setRemoving(undefined);
    } catch {
      // The caller reports the failure; keep the dialog open.
    }
  };

  const removingName = removing ? getDisplayName(removing) : '';

  return (
    <div className="min-w-[750px] space-y-6">
      {showAddForm && (
        <AddEquipmentForm
          isCreating={isCreating}
          onCreate={onCreate}
          onClose={() => onShowAddFormChange(false)}
        />
      )}

      {CATEGORY_ORDER.map(category => {
        const categoryItems = groups.get(category);
        if (!categoryItems) return null;
        return (
          <EquipmentCategorySection
            key={category}
            category={category}
            itemCount={categoryItems.length}
          >
            {categoryItems.map(item =>
              editingId === item.itemId ? (
                <EquipmentRowEditor
                  key={item.itemId}
                  item={item}
                  isUpdating={updatingItems.has(item.itemId)}
                  onSave={data => saveEdit(item.itemId, data)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <EquipmentRow
                  key={item.itemId}
                  item={item}
                  isUpdating={updatingItems.has(item.itemId)}
                  isDeleting={deletingItems.has(item.itemId)}
                  onEdit={() => setEditingId(item.itemId)}
                  onResetNeeded={() =>
                    void onUpdate(item.itemId, { neededOverride: null }).catch(
                      () => {},
                    )
                  }
                  onRemove={() => setRemoving(item)}
                />
              ),
            )}
          </EquipmentCategorySection>
        );
      })}

      <HiddenEquipmentList
        items={hiddenItems}
        updatingItems={updatingItems}
        onRestore={itemId =>
          void onUpdate(itemId, { enabled: true }).catch(() => {})
        }
      />

      <DeleteConfirmDialog
        open={removing !== undefined}
        onOpenChange={open => !open && setRemoving(undefined)}
        onConfirm={confirmRemove}
        isPending={
          removing !== undefined &&
          (updatingItems.has(removing.itemId) ||
            deletingItems.has(removing.itemId))
        }
        title={
          removing?.isCustom
            ? t('hive:equipment.table.deleteItem')
            : t('hive:equipment.table.hideItem')
        }
        description={
          removing?.isCustom
            ? t('hive:equipment.table.deleteConfirm', { name: removingName })
            : t('hive:equipment.table.hideConfirm', { name: removingName })
        }
      />
    </div>
  );
}
