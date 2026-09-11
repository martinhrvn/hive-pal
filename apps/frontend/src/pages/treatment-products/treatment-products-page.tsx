import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, FlaskConical, Lock } from 'lucide-react';
import {
  amountUnitDimension,
  concentrationToMgPerBase,
  CONCENTRATION_UNITS,
  type ConcentrationUnit,
  type CreateTreatmentProductDto,
  type TreatmentProduct,
} from 'shared-schemas';
import {
  useActiveIngredients,
  useCreateTreatmentProduct,
  useDeleteTreatmentProduct,
  useTreatmentProducts,
  useUpdateTreatmentProduct,
} from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DeleteConfirmDialog } from '@/components/common/delete-confirm-dialog';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';

const PHYSICAL_FORMS = ['LIQUID', 'POWDER', 'GEL', 'STRIP', 'GASEOUS'] as const;
const APPLICATION_METHODS = [
  'TRICKLE',
  'SPRAY',
  'SUBLIMATE',
  'EVAPORATE',
  'INSERT',
  'OTHER',
] as const;
const AMOUNT_UNITS = ['ml', 'g', 'pcs'] as const;

interface IngredientRow {
  activeIngredientId: string;
  concentration: string;
  concentrationUnit: ConcentrationUnit;
}
interface ProductForm {
  name: string;
  physicalForm: (typeof PHYSICAL_FORMS)[number];
  applicationMethod: string;
  defaultUnit: string;
  density: string;
  withdrawalPeriodDays: string;
  ingredients: IngredientRow[];
}

const emptyForm: ProductForm = {
  name: '',
  physicalForm: 'LIQUID',
  applicationMethod: '',
  defaultUnit: 'ml',
  density: '',
  withdrawalPeriodDays: '',
  ingredients: [],
};

/** Density is only needed when the amount unit and a concentration basis differ dimensions (volume<->mass). */
function densityNeeded(form: ProductForm): boolean {
  const amtDim = amountUnitDimension(form.defaultUnit);
  if (!amtDim) return false;
  return form.ingredients.some((i) => {
    const cDim = concentrationToMgPerBase(1, i.concentrationUnit).dim;
    return (
      (amtDim === 'VOLUME' && cDim === 'MASS') ||
      (amtDim === 'MASS' && cDim === 'VOLUME')
    );
  });
}

export function TreatmentProductsPage() {
  const { t } = useTranslation('hive');
  const { data: products, isLoading } = useTreatmentProducts();
  const { data: ingredients } = useActiveIngredients();
  const createMut = useCreateTreatmentProduct();
  const updateMut = useUpdateTreatmentProduct();
  const deleteMut = useDeleteTreatmentProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TreatmentProduct | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [toDelete, setToDelete] = useState<TreatmentProduct | null>(null);

  const deleteDialog = useDeleteDialog(async () => {
    if (toDelete) await deleteMut.mutateAsync(toDelete.id);
  });

  const ingredientName = (id: string) =>
    ingredients?.find((i) => i.id === id)?.name ?? id;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowAdvanced(false);
    setDialogOpen(true);
  };
  const openEdit = (p: TreatmentProduct) => {
    setEditing(p);
    setForm({
      name: p.name,
      physicalForm: p.physicalForm,
      applicationMethod: p.applicationMethod ?? '',
      defaultUnit: p.defaultUnit ?? 'ml',
      density: p.density != null ? String(p.density) : '',
      withdrawalPeriodDays:
        p.withdrawalPeriodDays != null ? String(p.withdrawalPeriodDays) : '',
      ingredients: p.ingredients.map((i) => ({
        activeIngredientId: i.activeIngredientId,
        concentration: String(i.concentration),
        concentrationUnit: i.concentrationUnit,
      })),
    });
    setShowAdvanced(p.density != null);
    setDialogOpen(true);
  };

  const setField = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const addIngredientRow = () =>
    setForm((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          activeIngredientId: ingredients?.[0]?.id ?? '',
          concentration: '',
          concentrationUnit: 'mg/ml',
        },
      ],
    }));
  const setIngredient = (idx: number, patch: Partial<IngredientRow>) =>
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((r, i) =>
        i === idx ? { ...r, ...patch } : r,
      ),
    }));
  const removeIngredient = (idx: number) =>
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx),
    }));

  const needDensity = densityNeeded(form);

  const canSave =
    form.name.trim().length >= 2 &&
    form.ingredients.every(
      (i) => i.activeIngredientId && Number(i.concentration) > 0,
    );

  const handleSave = async () => {
    const dto: CreateTreatmentProductDto = {
      name: form.name.trim(),
      physicalForm: form.physicalForm,
      applicationMethod: form.applicationMethod
        ? (form.applicationMethod as CreateTreatmentProductDto['applicationMethod'])
        : null,
      defaultUnit: form.defaultUnit || null,
      density: form.density ? Number(form.density) : null,
      withdrawalPeriodDays: form.withdrawalPeriodDays
        ? Number(form.withdrawalPeriodDays)
        : null,
      ingredients: form.ingredients.map((i) => ({
        activeIngredientId: i.activeIngredientId,
        concentration: Number(i.concentration),
        concentrationUnit: i.concentrationUnit,
      })),
    };
    if (editing) await updateMut.mutateAsync({ id: editing.id, dto });
    else await createMut.mutateAsync(dto);
    setDialogOpen(false);
  };

  const sorted = useMemo(
    () =>
      [...(products ?? [])].sort(
        (a, b) =>
          Number(b.isBuiltIn) - Number(a.isBuiltIn) ||
          a.name.localeCompare(b.name),
      ),
    [products],
  );

  return (
    <div className="container mx-auto max-w-4xl py-6 space-y-4" data-test="treatment-products-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FlaskConical className="h-6 w-6" />
            {t('treatmentProducts.title', { defaultValue: 'Treatment products' })}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('treatmentProducts.subtitle', {
              defaultValue:
                'Define your own treatment products and their active-ingredient composition.',
            })}
          </p>
        </div>
        <Button onClick={openCreate} data-test="add-treatment-product">
          <Plus className="h-4 w-4 mr-1" />
          {t('treatmentProducts.add', { defaultValue: 'Add product' })}
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {sorted.map((p) => (
          <Card key={p.id} data-test="treatment-product-card">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {p.name}
                  {p.isBuiltIn && (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </CardTitle>
                <div className="flex gap-1">
                  <Badge variant="secondary">{p.physicalForm}</Badge>
                </div>
              </div>
              <CardDescription>
                {p.ingredients.length === 0
                  ? t('treatmentProducts.noComposition', {
                      defaultValue: 'No composition set',
                    })
                  : p.ingredients
                      .map(
                        (i) =>
                          `${ingredientName(i.activeIngredientId)} ${i.concentration} ${i.concentrationUnit}`,
                      )
                      .join(' · ')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-0">
              <span className="text-xs text-muted-foreground">
                {p.withdrawalPeriodDays != null
                  ? t('treatmentProducts.withdrawalDays', {
                      defaultValue: 'Withdrawal: {{d}} days',
                      d: p.withdrawalPeriodDays,
                    })
                  : t('treatmentProducts.withdrawalUnknown', {
                      defaultValue: 'Withdrawal: n/a',
                    })}
              </span>
              {!p.isBuiltIn && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(p)}
                    data-test="edit-treatment-product"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setToDelete(p);
                      deleteDialog.open();
                    }}
                    data-test="delete-treatment-product"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? t('treatmentProducts.editTitle', { defaultValue: 'Edit product' })
                : t('treatmentProducts.add', { defaultValue: 'Add product' })}
            </DialogTitle>
            <DialogDescription>
              {t('treatmentProducts.dialogHint', {
                defaultValue:
                  'Set the physical form and the active ingredients with their concentration.',
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t('treatmentProducts.name', { defaultValue: 'Name' })}</Label>
              <Input
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                data-test="tp-name"
                placeholder="VarroMed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>
                  {t('treatmentProducts.form', { defaultValue: 'Physical form' })}
                </Label>
                <Select
                  value={form.physicalForm}
                  onValueChange={(v) =>
                    setField('physicalForm', v as ProductForm['physicalForm'])
                  }
                >
                  <SelectTrigger data-test="tp-form">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHYSICAL_FORMS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>
                  {t('treatmentProducts.method', {
                    defaultValue: 'Application (optional)',
                  })}
                </Label>
                <Select
                  value={form.applicationMethod || 'none'}
                  onValueChange={(v) =>
                    setField('applicationMethod', v === 'none' ? '' : v)
                  }
                >
                  <SelectTrigger data-test="tp-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {APPLICATION_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>
                  {t('treatmentProducts.defaultUnit', {
                    defaultValue: 'Amount unit',
                  })}
                </Label>
                <Select
                  value={form.defaultUnit}
                  onValueChange={(v) => setField('defaultUnit', v)}
                >
                  <SelectTrigger data-test="tp-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AMOUNT_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>
                  {t('treatmentProducts.withdrawal', {
                    defaultValue: 'Withdrawal (days)',
                  })}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.withdrawalPeriodDays}
                  onChange={(e) =>
                    setField('withdrawalPeriodDays', e.target.value)
                  }
                  data-test="tp-withdrawal"
                />
              </div>
            </div>

            {/* Composition editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  {t('treatmentProducts.composition', {
                    defaultValue: 'Active ingredients',
                  })}
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addIngredientRow}
                  data-test="tp-add-ingredient"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {t('treatmentProducts.addIngredient', {
                    defaultValue: 'Add ingredient',
                  })}
                </Button>
              </div>
              {form.ingredients.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-center" data-test="tp-ingredient-row">
                  <Select
                    value={row.activeIngredientId}
                    onValueChange={(v) =>
                      setIngredient(idx, { activeIngredientId: v })
                    }
                  >
                    <SelectTrigger className="flex-1" data-test="tp-ingredient-select">
                      <SelectValue placeholder="Ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients?.map((ing) => (
                        <SelectItem key={ing.id} value={ing.id}>
                          {ing.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    className="w-20"
                    value={row.concentration}
                    onChange={(e) =>
                      setIngredient(idx, { concentration: e.target.value })
                    }
                    data-test="tp-conc"
                    placeholder="44"
                  />
                  <Select
                    value={row.concentrationUnit}
                    onValueChange={(v) =>
                      setIngredient(idx, {
                        concentrationUnit: v as ConcentrationUnit,
                      })
                    }
                  >
                    <SelectTrigger className="w-28" data-test="tp-conc-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONCENTRATION_UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeIngredient(idx)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Density: shown when needed, or under advanced */}
            {(needDensity || showAdvanced) && (
              <div className="space-y-1">
                <Label>
                  {t('treatmentProducts.density', {
                    defaultValue: 'Density (g/ml)',
                  })}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.density}
                  onChange={(e) => setField('density', e.target.value)}
                  data-test="tp-density"
                />
                {needDensity && (
                  <p className="text-xs text-amber-600">
                    {t('treatmentProducts.densityHint', {
                      defaultValue:
                        'Density is required to convert between the amount unit and a concentration measured differently.',
                    })}
                  </p>
                )}
              </div>
            )}
            {!needDensity && !showAdvanced && (
              <button
                type="button"
                className="text-xs text-muted-foreground underline"
                onClick={() => setShowAdvanced(true)}
              >
                {t('treatmentProducts.advanced', { defaultValue: 'Advanced' })}
              </button>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('treatmentProducts.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSave || createMut.isPending || updateMut.isPending}
              data-test="tp-save"
            >
              {t('treatmentProducts.save', { defaultValue: 'Save' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialog.isOpen}
        isPending={deleteDialog.isPending}
        onOpenChange={(o) => !o && deleteDialog.close()}
        onConfirm={deleteDialog.handleDelete}
        title={t('treatmentProducts.deleteTitle', {
          defaultValue: 'Delete treatment product?',
        })}
        description={t('treatmentProducts.deleteDesc', {
          defaultValue: 'This removes your custom product. This cannot be undone.',
        })}
      />
    </div>
  );
}

export default TreatmentProductsPage;
