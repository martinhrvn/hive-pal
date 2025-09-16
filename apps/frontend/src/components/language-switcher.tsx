import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Languages } from 'lucide-react';
import { normalizeLanguageCode } from '@/utils/language-utils';

interface LanguageSwitcherProps {
  compact?: boolean;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
];

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  compact = false,
}) => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (languageCode: string) => {
    const normalizedCode = normalizeLanguageCode(languageCode);
    i18n.changeLanguage(normalizedCode);
    localStorage.setItem('language', normalizedCode);
  };

  const getCurrentLanguage = () => {
    const normalizedLang = normalizeLanguageCode(i18n.language);
    return LANGUAGES.find(lang => lang.code === normalizedLang) || LANGUAGES[0];
  };

  if (compact) {
    return (
      <Select value={normalizeLanguageCode(i18n.language)} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-12 h-8 border-none shadow-none">
          <SelectValue>
            <Languages className="h-4 w-4" />
          </SelectValue>
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

  return (
    <Select value={normalizeLanguageCode(i18n.language)} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-40">
        <SelectValue>
          <div className="flex items-center gap-2">
            <span>{getCurrentLanguage().flag}</span>
            <span>{getCurrentLanguage().name}</span>
          </div>
        </SelectValue>
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
};
