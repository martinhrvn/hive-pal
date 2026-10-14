import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { QueenRef } from 'shared-schemas';
import { useQueens } from '@/api/hooks';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getQueenDisplayName } from '@/lib/queen-utils';
import { FormSection } from './form-section';
import { TextField } from './text-field';
import type { QueenFormValues } from './queen-form-schema';

// Radix Select can't hold an empty string as an item value
const NO_MOTHER = 'none';

const MotherQueenField = ({
  queenId,
  currentMother,
}: {
  queenId?: string;
  currentMother?: QueenRef | null;
}) => {
  const { t } = useTranslation('queen');
  const { control } = useFormContext<QueenFormValues>();
  const { data: queens = [] } = useQueens();

  const candidates = queens.filter(queen => queen.id !== queenId);
  // The mother may live in an apiary outside the current selection
  if (currentMother && !candidates.some(q => q.id === currentMother.id)) {
    candidates.unshift(currentMother);
  }

  return (
    <FormField
      control={control}
      name="motherQueenId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('fields.mother')}</FormLabel>
          <Select
            value={field.value || NO_MOTHER}
            onValueChange={value =>
              field.onChange(value === NO_MOTHER ? '' : value)
            }
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('form.selectMother')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={NO_MOTHER}>{t('form.noMother')}</SelectItem>
              {candidates.map(queen => (
                <SelectItem key={queen.id} value={queen.id}>
                  {getQueenDisplayName(t, queen)}
                  {queen.year != null && queen.name && (
                    <span className="text-muted-foreground">{queen.year}</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const OriginFields = (props: {
  queenId?: string;
  currentMother?: QueenRef | null;
}) => {
  const { t } = useTranslation('queen');
  return (
    <FormSection title={t('sections.origin')}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField
          name="source"
          label={t('fields.source')}
          placeholder={t('form.enterSource')}
        />
        <TextField
          name="breeder"
          label={t('fields.breeder')}
          placeholder={t('form.enterBreeder')}
        />
        <TextField
          name="line"
          label={t('fields.line')}
          placeholder={t('form.enterLine')}
        />
        <MotherQueenField {...props} />
      </div>
    </FormSection>
  );
};
