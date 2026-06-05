import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusCircle, Pencil, Trash, ArrowLeft, Printer } from 'lucide-react';
import { MenuItemButton } from './menu-item-button';

interface CreateButtonProps {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
}

export const CreateButton: React.FC<CreateButtonProps> = ({
  label,
  onClick,
  disabled,
}) => (
  <MenuItemButton
    icon={<PlusCircle className="h-4 w-4" />}
    label={label}
    onClick={onClick}
    tooltip={label}
    disabled={disabled}
  />
);

interface EditButtonProps {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
}

export const EditButton: React.FC<EditButtonProps> = ({
  label,
  onClick,
  disabled,
}) => (
  <MenuItemButton
    icon={<Pencil className="h-4 w-4" />}
    label={label}
    onClick={onClick}
    tooltip={label}
    disabled={disabled}
  />
);

interface DeleteButtonProps {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({
  label,
  onClick,
  disabled,
}) => (
  <MenuItemButton
    icon={<Trash className="h-4 w-4" />}
    label={label}
    onClick={onClick}
    tooltip={label}
    disabled={disabled}
    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
  />
);

interface BackButtonProps {
  readonly label?: string;
  readonly to?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ label, to }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const backLabel = label || t('actions.goBack', { defaultValue: 'Go Back' });

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <MenuItemButton
      icon={<ArrowLeft className="h-4 w-4" />}
      label={backLabel}
      onClick={handleClick}
      tooltip={backLabel}
    />
  );
};

interface PrintButtonProps {
  readonly label?: string;
}

export const PrintButton: React.FC<PrintButtonProps> = ({ label }) => {
  const { t } = useTranslation('common');
  const printLabel = label || t('actions.print', { defaultValue: 'Print' });

  return (
    <MenuItemButton
      icon={<Printer className="h-4 w-4" />}
      label={printLabel}
      onClick={() => globalThis.print()}
      tooltip={printLabel}
    />
  );
};
