import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { TriangleAlert } from 'lucide-react';
import { isCurrentQueenStatus } from 'shared-schemas';
import { useHive } from '@/api/hooks';
import { HiveSelect } from '@/components/common/hive-select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormSection } from './form-section';
import type { QueenFormValues } from './queen-form-schema';

/** Saving an active or virgin queen into a hive retires that hive's current queen. */
const ActiveQueenWarning = ({ hiveId }: { hiveId: string }) => {
  const { t } = useTranslation('queen');
  const status = useWatch<QueenFormValues, 'status'>({ name: 'status' });
  const { data: hive } = useHive(hiveId);

  if (!isCurrentQueenStatus(status) || !hive?.activeQueen) return null;
  return (
    <p className="flex gap-2 rounded-md bg-warning-muted p-3 text-sm text-warning-foreground">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      {t('information.hasActiveQueen')}
    </p>
  );
};

/** New queen without a hive in the URL: pick one. */
export const HivePickerFields = () => {
  const { t } = useTranslation('queen');
  const { control } = useFormContext<QueenFormValues>();
  const hiveId = useWatch({ control, name: 'hiveId' });

  return (
    <FormSection title={t('sections.hive')}>
      <FormField
        control={control}
        name="hiveId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('fields.hive')}</FormLabel>
            <FormControl>
              <HiveSelect
                value={field.value}
                onValueChange={field.onChange}
                placeholder={t('form.selectHive')}
                className="w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <ActiveQueenWarning hiveId={hiveId} />
    </FormSection>
  );
};

/**
 * The hive is fixed: either given by the URL (new queen), or the queen
 * already lives there and moves only through a transfer (edit).
 */
export const FixedHiveFields = ({
  hiveId,
  hiveName,
  hint,
}: {
  hiveId?: string | null;
  hiveName?: string | null;
  hint?: string;
}) => {
  const { t } = useTranslation('queen');
  const { data: hive } = useHive(hiveId ?? '', {
    enabled: !!hiveId && !hiveName,
  });
  const name = hiveName ?? hive?.name;

  return (
    <FormSection title={t('sections.hive')} description={hint}>
      <p className="text-sm font-medium">{name ?? t('form.notInHive')}</p>
      {!hint && hiveId && <ActiveQueenWarning hiveId={hiveId} />}
    </FormSection>
  );
};
