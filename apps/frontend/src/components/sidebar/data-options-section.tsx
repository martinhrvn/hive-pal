import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileDown, Printer, Share2 } from 'lucide-react';

import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from '@/components/ui/sidebar';
import { MenuItemButton } from './menu-item-button';

interface DataOptionsSectionProps {
  i18nNamespace: string;
  onExport?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  additionalItems?: React.ReactNode;
  className?: string;
}

export const DataOptionsSection: React.FC<DataOptionsSectionProps> = ({
  i18nNamespace,
  onExport,
  onPrint,
  onShare,
  additionalItems,
  className,
}) => {
  const { t } = useTranslation([i18nNamespace, 'common']);

  const handleExport = onExport || (() => alert(t(`${i18nNamespace}:messages.exportComingSoon`)));
  const handlePrint = onPrint || (() => window.print());
  const handleShare = onShare || (() => alert(t(`${i18nNamespace}:messages.shareComingSoon`)));

  return (
    <SidebarGroup className={className}>
      <SidebarGroupLabel>
        {t(`${i18nNamespace}:actions.dataOptions`)}
      </SidebarGroupLabel>
      <SidebarMenu>
        <MenuItemButton
          icon={<FileDown className="h-4 w-4" />}
          label={t(`${i18nNamespace}:actions.exportCSV`)}
          onClick={handleExport}
          tooltip={t(`${i18nNamespace}:actions.exportCSV`)}
        />
        <MenuItemButton
          icon={<Printer className="h-4 w-4" />}
          label={t(`${i18nNamespace}:actions.print`)}
          onClick={handlePrint}
          tooltip={t(`${i18nNamespace}:actions.print`)}
        />
        {additionalItems}
        <MenuItemButton
          icon={<Share2 className="h-4 w-4" />}
          label={t(`${i18nNamespace}:actions.share`)}
          onClick={handleShare}
          tooltip={t(`${i18nNamespace}:actions.share`)}
        />
      </SidebarMenu>
    </SidebarGroup>
  );
};
