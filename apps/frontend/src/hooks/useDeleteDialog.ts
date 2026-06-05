import { useState } from 'react';

export function useDeleteDialog<T = void>(
  onDelete: () => Promise<T>,
  onSuccess?: (result: T) => void,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const handleDelete = async () => {
    setIsPending(true);
    try {
      const result = await onDelete();
      setIsOpen(false);
      onSuccess?.(result);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsPending(false);
    }
  };

  return {
    isOpen,
    isPending,
    open,
    close,
    handleDelete,
  };
}
