import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLanguageNavigation } from '@/hooks/use-language-navigation';
import { LANGUAGES, normalizeLanguageCode } from '@/utils/language-utils';

/**
 * Compact language picker for the headers of the public (logged-out) pages:
 * a globe-style trigger showing the current language code, opening a list of
 * every UI language. Picking one moves to that language's public URL.
 */
export function LanguageMenu({ className }: Readonly<{ className?: string }>) {
  const { t, i18n } = useTranslation('common');
  const switchLanguage = useLanguageNavigation({ publicChrome: true });
  const currentLanguage = normalizeLanguageCode(i18n.language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('actions.language')}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium uppercase outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
      >
        <Languages className="size-4" aria-hidden="true" />
        {/* de-informal shares the German label; the menu tells them apart. */}
        {currentLanguage.split('-')[0]}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={currentLanguage}
          onValueChange={switchLanguage}
        >
          {LANGUAGES.map(language => (
            <DropdownMenuRadioItem key={language.code} value={language.code}>
              <span aria-hidden="true">{language.flag}</span>
              {language.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
