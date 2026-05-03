import React from 'react';
import { Button } from '@/components/ui/button';
import { EditIcon, TrashIcon } from 'lucide-react';

/**
 * Reusable container component for action edit/view patterns
 *
 * Handles the common pattern of showing either a form (editing) or
 * a view with edit/delete buttons.
 *
 * @param isEditing - Current editing state
 * @param onToggleEdit - Callback to toggle editing state
 * @param action - The action data
 * @param FormComponent - Component to render in edit mode
 * @param ViewComponent - Component to render in view mode
 * @param onSave - Callback when form is saved
 * @param onRemove - Callback when action is removed
 */
interface ActionViewContainerProps<T> {
  isEditing: boolean;
  onToggleEdit: (editing: boolean) => void;
  action: T | undefined;
  FormComponent: React.ComponentType<{
    action?: T;
    onSave: (action: T) => void;
    onRemove?: (actionType: string) => void;
  }>;
  ViewComponent: React.ComponentType<{
    action: T;
    onEdit: () => void;
    onRemove: () => void;
  }>;
  onSave: (action: T) => void;
  onRemove: () => void;
}

export function ActionViewContainer<T extends { type: string }>({
  isEditing,
  onToggleEdit,
  action,
  FormComponent,
  ViewComponent,
  onSave,
  onRemove,
}: ActionViewContainerProps<T>) {
  if (!action) return null;

  if (isEditing) {
    return (
      <FormComponent
        action={action}
        onSave={a => {
          onSave(a);
          onToggleEdit(false);
        }}
        onRemove={() => onRemove()}
      />
    );
  }

  return (
    <ViewComponent
      action={action}
      onEdit={() => onToggleEdit(true)}
      onRemove={onRemove}
    />
  );
}

/**
 * Reusable view renderer for action display with edit/delete buttons
 *
 * Provides consistent layout for viewing action details with badges
 * and action buttons.
 */
interface ActionViewRendererProps {
  title: string;
  badges: React.ReactNode;
  notes?: string | null;
  onEdit: () => void;
  onRemove: () => void;
  [key: string]: unknown;
}

export function ActionViewRenderer({
  title,
  badges,
  notes,
  onEdit,
  onRemove,
  ...props
}: ActionViewRendererProps) {
  return (
    <div className={'flex justify-between items-center w-full mt-5'} {...props}>
      <div className={'flex flex-col gap-2'}>
        <h3 className="font-medium">{title}</h3>
        <div className={'flex gap-5 text-sm'}>{badges}</div>
        {notes && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            <span>Notes: {notes}</span>
          </div>
        )}
      </div>
      <div>
        <Button
          variant={'ghost'}
          aria-label={'Edit'}
          onClick={onEdit}
        >
          <EditIcon />
        </Button>
        <Button
          variant={'ghost'}
          aria-label={'Delete'}
          onClick={onRemove}
        >
          <TrashIcon />
        </Button>
      </div>
    </div>
  );
}
