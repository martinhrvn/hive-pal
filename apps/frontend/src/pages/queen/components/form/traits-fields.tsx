import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { QUEEN_TRAITS } from 'shared-schemas';
import { FormField } from '@/components/ui/form';
import { RatingInput } from '../trait-rating';
import { FormSection } from './form-section';
import type { QueenFormValues } from './queen-form-schema';

export const TraitsFields = () => {
  const { t } = useTranslation('queen');
  const { control } = useFormContext<QueenFormValues>();

  return (
    <FormSection title={t('sections.traits')} description={t('traits.hint')}>
      <div className="space-y-3">
        {QUEEN_TRAITS.map(trait => (
          <FormField
            key={trait}
            control={control}
            name={trait}
            render={({ field }) => (
              <RatingInput
                label={t(`traits.${trait}`)}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        ))}
      </div>
    </FormSection>
  );
};
