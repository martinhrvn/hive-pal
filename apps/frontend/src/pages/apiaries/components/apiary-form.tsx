import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiariesSchema } from './schema';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useApiary,
  useCreateApiary,
  useUpdateApiary,
} from '@/api/hooks/useApiaries';
import { useCreatePhoto } from '@/api/hooks';
import {
  FeaturePhotoPicker,
  FeaturePhotoPickerRef,
} from '@/components/feature-photo-picker';

// Lazy load the map component (heavy ~200KB)
const MapPicker = lazy(() => import('@/components/common/map-picker.tsx'));

function MapLoader() {
  return (
    <div className="flex h-96 items-center justify-center bg-muted/50 rounded-md border">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export type ApiaryFormData = z.infer<typeof apiariesSchema>;

type ApiaryFormProps = {
  apiaryId?: string;
  onSubmit?: (data: ApiaryFormData) => void;
  isLoading?: boolean;
};
export const ApiaryForm: React.FC<ApiaryFormProps> = ({
  apiaryId,
  onSubmit: onSubmitOverride,
  isLoading,
}) => {
  const { t } = useTranslation(['apiary', 'common']);
  const navigate = useNavigate();
  const featurePhotoRef = useRef<FeaturePhotoPickerRef>(null);
  const isEditMode = !!apiaryId;

  const { data: existingApiary } = useApiary(apiaryId || '', {
    enabled: isEditMode,
  });
  const { mutateAsync } = useCreateApiary();
  const { mutateAsync: updateApiary } = useUpdateApiary();
  const createPhoto = useCreatePhoto();
  const [featurePhotoUrl, setFeaturePhotoUrl] = useState<string | null>(null);

  const form = useForm<ApiaryFormData>({
    resolver: zodResolver(apiariesSchema),
    defaultValues: {
      name: '',
      location: '',
      settings: { inspectionType: 'subjective' },
    },
  });

  useEffect(() => {
    if (existingApiary) {
      form.reset({
        name: existingApiary.name,
        location: existingApiary.location || '',
        latitude: existingApiary.latitude ?? undefined,
        longitude: existingApiary.longitude ?? undefined,
        featurePhotoId: existingApiary.featurePhotoId ?? null,
        settings: { inspectionType: existingApiary.settings?.inspectionType ?? 'data_driven' },
      });
      if (existingApiary.featurePhotoUrl) {
        setFeaturePhotoUrl(existingApiary.featurePhotoUrl);
      }
    }
  }, [existingApiary, form]);

  const onSubmit = async (data: ApiaryFormData) => {
    if (onSubmitOverride) {
      onSubmitOverride(data);
      return;
    }
    try {
      if (isEditMode) {
        await updateApiary({
          id: apiaryId,
          data: {
            name: data.name,
            location: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            featurePhotoId: data.featurePhotoId,
            settings: data.settings,
          },
        });

        navigate(`/apiaries/${apiaryId}`);
      } else {
        const apiary = await mutateAsync({
          name: data.name,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
          settings: data.settings,
        });

        // If there's a pending file, upload it and link as feature photo
        const pendingFile = featurePhotoRef.current?.getPendingFile();
        if (pendingFile) {
          const formData = new FormData();
          formData.append('file', pendingFile);
          formData.append('apiaryId', apiary.id);
          formData.append('caption', 'Feature photo');
          formData.append('date', new Date().toISOString());

          const photo = await createPhoto.mutateAsync(formData);
          await updateApiary({
            id: apiary.id,
            data: { featurePhotoId: photo.id },
          });
          featurePhotoRef.current?.clearPendingFile();
        }

        navigate('/');
      }
    } catch (error) {
      console.error(
        `Failed to ${isEditMode ? 'update' : 'create'} apiary`,
        error,
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('apiary:fields.name')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('apiary:form.namePlaceholder')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('apiary:fields.location')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('apiary:form.locationPlaceholder')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FeaturePhotoPicker
          ref={featurePhotoRef}
          apiaryId={apiaryId}
          currentPhotoUrl={featurePhotoUrl}
          currentPhotoId={form.watch('featurePhotoId') ?? undefined}
          onPhotoUploaded={(photoId) =>
            form.setValue('featurePhotoId', photoId, { shouldDirty: true })
          }
          onPhotoRemoved={() => {
            form.setValue('featurePhotoId', null, { shouldDirty: true });
            setFeaturePhotoUrl(null);
          }}
        />

        <Suspense fallback={<MapLoader />}>
          <MapPicker
            initialLocation={
              existingApiary?.latitude && existingApiary?.longitude
                ? {
                    lat: existingApiary.latitude,
                    lng: existingApiary.longitude,
                  }
                : undefined
            }
            onLocationSelect={({ latitude, longitude }) => {
              form.setValue('latitude', latitude);
              form.setValue('longitude', longitude);
            }}
          />
        </Suspense>

        <FormField
          control={form.control}
          name="settings.inspectionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('apiary:form.inspectionType.label')}</FormLabel>
              <Select key={field.value} onValueChange={field.onChange} value={field.value ?? 'data_driven'}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('apiary:form.inspectionType.placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="data_driven">{t('apiary:form.inspectionType.dataDriven')}</SelectItem>
                  <SelectItem value="subjective">{t('apiary:form.inspectionType.subjective')}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {t('apiary:form.inspectionType.description')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="mr-2"
            onClick={() => (window.location.href = '/')}
          >
            {t('common:actions.cancel')}
          </Button>
          <Button
            disabled={isLoading}
            type={'submit'}
            data-umami-event={isEditMode ? 'Apiary Edit' : 'Apiary Create'}
          >
            {isEditMode ? t('apiary:edit.title', { defaultValue: 'Edit Apiary' }) : t('apiary:create.title')}
          </Button>
        </div>
      </form>
    </Form>
  );
};
