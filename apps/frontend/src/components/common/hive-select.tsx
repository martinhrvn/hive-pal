import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHives } from '@/api/hooks';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface HiveSelectProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly placeholder?: string;
  readonly emptyMessage?: string;
  readonly i18nNamespace?: string;
  readonly disabled?: boolean;
}

export const HiveSelect: React.FC<HiveSelectProps> = ({
  value,
  onValueChange,
  placeholder,
  emptyMessage,
  i18nNamespace = 'common',
  disabled,
}) => {
  const { t } = useTranslation(i18nNamespace);
  const { data: hives = [], isLoading } = useHives();

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (hives.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {emptyMessage || t('noHivesAvailable', { defaultValue: 'No hives available' })}
      </p>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue
          placeholder={
            placeholder || t('selectHive', { defaultValue: 'Select a hive' })
          }
        />
      </SelectTrigger>
      <SelectContent>
        {hives.map((hive) => (
          <SelectItem key={hive.id} value={hive.id}>
            {hive.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
