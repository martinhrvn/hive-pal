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
import { normalizeLanguageCode } from '@/utils/language-utils';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation('common');

  const handleLanguageChange = (languageCode: string) => {
    const normalizedCode = normalizeLanguageCode(languageCode);
    i18n.changeLanguage(normalizedCode);
    localStorage.setItem('language', normalizedCode);
  };

  const currentLanguage = normalizeLanguageCode(i18n.language);

  return (
    <SidebarGroup>
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
