import { useTranslation } from 'react-i18next';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Scale } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Box } from 'shared-schemas';
import { measurementSideSchema } from 'shared-schemas';
import { useUnitFormat } from '@/hooks/use-unit-format';
import type { InspectionFormData } from './schema';

// Sentinel select values standing in for a null boxId / side. shadcn's Select
// cannot hold an empty-string value, so we round-trip through these.
const WHOLE_HIVE = '__whole_hive__';
const WHOLE_WEIGHT = '__whole_weight__';

const SIDES = measurementSideSchema.options; // ['FRONT','BACK','LEFT','RIGHT']

type WeightSectionProps = {
  hiveBoxes?: Box[];
};

export function WeightSection({ hiveBoxes = [] }: WeightSectionProps) {
  const { t } = useTranslation('inspection');
  const form = useFormContext<InspectionFormData>();
  const { getWeightUnit } = useUnitFormat();
  const unitLabel = getWeightUnit();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'weights',
  });

  // Boxes bottom-to-top; the lowest box represents "am Boden". Only persisted
  // boxes (with an id) can be referenced by a measurement.
  const sortedBoxes = [...hiveBoxes]
    .filter((b): b is Box & { id: string } => typeof b.id === 'string')
    .sort((a, b) => a.position - b.position);

  const boxLabel = (box: Box) =>
    t('inspection:form.weights.boxLabel', {
      position: box.position + 1,
      type: t(`inspection:form.weights.boxType.${box.type}`, box.type),
    });

  return (
    <div className="space-y-4 rounded-md p-3">
      <div className="flex items-center gap-2">
        <Scale className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-medium">
          {t('inspection:form.weights.title')}
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">
        {t('inspection:form.weights.description')}
      </p>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          {t('inspection:form.weights.empty')}
        </p>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end rounded-md border border-border p-3"
          >
            <FormField
              control={form.control}
              name={`weights.${index}.value`}
              render={({ field: valueField }) => (
                <FormItem>
                  <FormLabel>
                    {t('inspection:form.weights.value', { unit: unitLabel })}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min="0"
                      value={
                        valueField.value === undefined ||
                        Number.isNaN(valueField.value)
                          ? ''
                          : valueField.value
                      }
                      onChange={e =>
                        valueField.onChange(
                          e.target.value === ''
                            ? undefined
                            : e.target.valueAsNumber,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`weights.${index}.boxId`}
              render={({ field: boxField }) => (
                <FormItem>
                  <FormLabel>
                    {t('inspection:form.weights.position')}
                  </FormLabel>
                  <Select
                    value={boxField.value ?? WHOLE_HIVE}
                    onValueChange={v =>
                      boxField.onChange(v === WHOLE_HIVE ? null : v)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={WHOLE_HIVE}>
                        {t('inspection:form.weights.wholeHive')}
                      </SelectItem>
                      {sortedBoxes.map(box => (
                        <SelectItem key={box.id} value={box.id}>
                          {boxLabel(box)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`weights.${index}.side`}
              render={({ field: sideField }) => (
                <FormItem>
                  <FormLabel>{t('inspection:form.weights.side')}</FormLabel>
                  <Select
                    value={sideField.value ?? WHOLE_WEIGHT}
                    onValueChange={v =>
                      sideField.onChange(v === WHOLE_WEIGHT ? null : v)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={WHOLE_WEIGHT}>
                        {t('inspection:form.weights.wholeWeight')}
                      </SelectItem>
                      {SIDES.map(side => (
                        <SelectItem key={side} value={side}>
                          {t(`inspection:form.weights.sides.${side}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => remove(index)}
              aria-label={t('inspection:form.weights.remove')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({ value: 0, unit: unitLabel, boxId: null, side: null })
        }
      >
        <Plus className="h-4 w-4 mr-1" />
        {t('inspection:form.weights.add')}
      </Button>
    </div>
  );
}
