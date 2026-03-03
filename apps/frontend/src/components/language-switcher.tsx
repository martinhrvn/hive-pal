import { ChevronRight, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { normalizeLanguageCode, LANGUAGES } from '@/utils/language-utils';

interface LanguageSwitcherProps {
  variant?: 'sidebar' | 'select' | 'buttons';
  className?: string;
  onLanguageChange?: (code: string) => void;
}

export function LanguageSwitcher({
  variant = 'sidebar',
  className,
  onLanguageChange,
}: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation('common');

  const handleLanguageChange = (languageCode: string) => {
    const normalizedCode = normalizeLanguageCode(languageCode);
    i18n.changeLanguage(normalizedCode);
    localStorage.setItem('language', normalizedCode);
    onLanguageChange?.(normalizedCode);
  };

  const currentLanguage = normalizeLanguageCode(i18n.language);

  if (variant === 'select') {
    return (
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className={className}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map(language => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center gap-2">
                <span>{language.flag}</span>
                <span>{language.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {LANGUAGES.map(language => (
          <Button
            key={language.code}
            variant={currentLanguage === language.code ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleLanguageChange(language.code)}
          >
            {language.code.toUpperCase()}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <SidebarGroup className={className}>
      <SidebarMenu>
        <Collapsible asChild className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={t('actions.language')}>
                <Languages />
                <span>{t('actions.language')}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {LANGUAGES.map(language => (
                  <SidebarMenuSubItem key={language.code}>
                    <SidebarMenuSubButton
                      onClick={() => handleLanguageChange(language.code)}
                      className={`cursor-pointer ${currentLanguage === language.code ? 'bg-accent' : ''}`}
                    >
                      <span>{language.flag}</span>
                      <span>{language.name}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}
