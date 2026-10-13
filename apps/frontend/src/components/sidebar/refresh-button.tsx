import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MenuItemButton } from './menu-item-button';

interface RefreshButtonProps {
  readonly onRefresh?: () => void;
  readonly i18nNamespace?: string;
  readonly label?: string;
  readonly disabled?: boolean;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  i18nNamespace = 'common',
  label,
  disabled,
}) => {
  const { t } = useTranslation(i18nNamespace);
  const refreshLabel =
    label || t('actions.refreshData', { defaultValue: 'Refresh Data' });

  return (
    <MenuItemButton
      icon={<RefreshCw />}
      label={refreshLabel}
      onClick={() => onRefresh?.()}
      disabled={disabled}
    />
  );
};
