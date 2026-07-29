import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Droplet, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  FEED_FORMS,
  FeedForm,
  UserFeedTypeResponse,
} from 'shared-schemas';
import {
  useCreateFeedType,
  useDeleteFeedType,
  useFeedTypes,
  useUpdateFeedType,
} from '@/api/hooks';

/**
 * Settings card for the user's custom feed types (label + physical form +
 * density + sugar content). These appear in the feeding form's picker next to
 * the built-in registry. Density enables ml/L entry; sugar content drives the
 * sugar readout in feeding records.
 */

type DraftFeedType = {
  label: string;
  form: FeedForm;
  density: string; // kept as text for free-form decimal entry
  sugarContent: string;
};

const EMPTY_DRAFT: DraftFeedType = {
  label: '',
  form: 'INVERT_SYRUP',
  density: '',
  sugarContent: '',
};

const parseDecimal = (value: string): number | null => {
  if (value.trim() === '') return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

export const FeedTypesCard = () => {
  const { t } = useTranslation('common');
  const { data: feedTypes = [], isLoading } = useFeedTypes();
  const createFeedType = useCreateFeedType();
  const updateFeedType = useUpdateFeedType();
  const deleteFeedType = useDeleteFeedType();

  // null → collapsed; '' → creating; id → editing that type
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftFeedType>(EMPTY_DRAFT);

  const formLabel = (form: FeedForm) =>
    t(`feedTypes.forms.${form}`, { defaultValue: FORM_FALLBACKS[form] });

  const startCreate = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId('');
  };

  const startEdit = (feedType: UserFeedTypeResponse) => {
    setDraft({
      label: feedType.label,
      form: feedType.form,
      density: feedType.density != null ? String(feedType.density) : '',
      sugarContent: String(feedType.sugarContent),
    });
    setEditingId(feedType.id);
  };

  const handleSave = async () => {
    const density = parseDecimal(draft.density);
    const sugarContent = parseDecimal(draft.sugarContent);
    if (!draft.label.trim() || sugarContent == null) return;

    const payload = {
      label: draft.label.trim(),
      form: draft.form,
      density,
      sugarContent,
    };
    try {
      if (editingId === '') {
        await createFeedType.mutateAsync(payload);
      } else if (editingId) {
        await updateFeedType.mutateAsync({ id: editingId, data: payload });
      }
      setEditingId(null);
      setDraft(EMPTY_DRAFT);
    } catch {
      toast.error(
        t('feedTypes.saveFailed', {
          defaultValue:
            'Could not save the feed type. Is the name already in use?',
        }),
      );
    }
  };

  const handleDelete = async (feedType: UserFeedTypeResponse) => {
    try {
      await deleteFeedType.mutateAsync(feedType.id);
    } catch {
      toast.error(
        t('feedTypes.deleteFailed', {
          defaultValue: 'Could not delete the feed type.',
        }),
      );
    }
  };

  const isSaving = createFeedType.isPending || updateFeedType.isPending;
  const sugarValid = parseDecimal(draft.sugarContent) != null;
  const canSave = draft.label.trim().length > 0 && sugarValid && !isSaving;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplet className="h-5 w-5" />
          {t('feedTypes.title', { defaultValue: 'Feed types' })}
        </CardTitle>
        <CardDescription>
          {t('feedTypes.description', {
            defaultValue:
              'Your own feeds (e.g. a commercial invert syrup) with density and sugar content. They appear in the feeding form next to the standard types.',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : feedTypes.length === 0 && editingId === null ? (
          <p className="text-sm text-muted-foreground">
            {t('feedTypes.empty', {
              defaultValue: 'No custom feed types yet.',
            })}
          </p>
        ) : (
          <ul className="space-y-2">
            {feedTypes.map(feedType => (
              <li
                key={feedType.id}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{feedType.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {formLabel(feedType.form)}
                    {' · '}
                    {t('feedTypes.sugarShort', {
                      defaultValue: '{{value}} % sugar',
                      value: feedType.sugarContent,
                    })}
                    {feedType.density != null && (
                      <>
                        {' · '}
                        {t('feedTypes.densityShort', {
                          defaultValue: '{{value}} g/ml',
                          value: feedType.density,
                        })}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={t('actions.edit', { defaultValue: 'Edit' })}
                    onClick={() => startEdit(feedType)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={t('actions.delete', { defaultValue: 'Delete' })}
                    onClick={() => void handleDelete(feedType)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {editingId !== null ? (
          <div className="space-y-3 rounded-md border p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="feed-type-label">
                  {t('feedTypes.name', { defaultValue: 'Name' })}
                </Label>
                <Input
                  id="feed-type-label"
                  placeholder={t('feedTypes.namePlaceholder', {
                    defaultValue: 'e.g. Apiinvert',
                  })}
                  value={draft.label}
                  onChange={e => setDraft({ ...draft, label: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="feed-type-form">
                  {t('feedTypes.form', { defaultValue: 'Form' })}
                </Label>
                <Select
                  value={draft.form}
                  onValueChange={value =>
                    setDraft({ ...draft, form: value as FeedForm })
                  }
                >
                  <SelectTrigger id="feed-type-form" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FEED_FORMS.map(form => (
                      <SelectItem key={form} value={form}>
                        {formLabel(form)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="feed-type-sugar">
                  {t('feedTypes.sugarContent', {
                    defaultValue: 'Sugar content (% by weight)',
                  })}
                </Label>
                <Input
                  id="feed-type-sugar"
                  inputMode="decimal"
                  placeholder="72.7"
                  value={draft.sugarContent}
                  onChange={e =>
                    setDraft({ ...draft, sugarContent: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="feed-type-density">
                  {t('feedTypes.density', {
                    defaultValue: 'Density (g/ml, liquids only)',
                  })}
                </Label>
                <Input
                  id="feed-type-density"
                  inputMode="decimal"
                  placeholder="1.28"
                  value={draft.density}
                  onChange={e =>
                    setDraft({ ...draft, density: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t('feedTypes.densityHint', {
                    defaultValue:
                      'Leave empty for solid feeds — they are entered by weight only.',
                  })}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingId(null)}
              >
                <X className="mr-1 h-4 w-4" />
                {t('actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button size="sm" disabled={!canSave} onClick={() => void handleSave()}>
                {isSaving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                {t('actions.save', { defaultValue: 'Save' })}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={startCreate}>
            <Plus className="mr-1 h-4 w-4" />
            {t('feedTypes.add', { defaultValue: 'Add feed type' })}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const FORM_FALLBACKS: Record<FeedForm, string> = {
  SYRUP: 'Syrup',
  INVERT_SYRUP: 'Invert syrup',
  FONDANT: 'Fondant',
  CANDY: 'Candy',
  DRY_SUGAR: 'Dry sugar',
  HONEY: 'Honey',
  PROTEIN: 'Protein feed',
  OTHER: 'Other',
};
