import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiariesSchema } from './schema';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import MapPicker from '@/components/common/map-picker.tsx';
import { useCreateApiary } from '@/api/hooks';

export type ApiaryFormData = z.infer<typeof apiariesSchema>;

type ApiaryFormProps = {
  onSubmit?: (data: ApiaryFormData) => void;
  isLoading?: boolean;
};
export const ApiaryForm: React.FC<ApiaryFormProps> = ({
  onSubmit: onSubmitOverride,
  isLoading,
}) => {
  const navigate = useNavigate();

  const { mutateAsync } = useCreateApiary();

  const form = useForm<ApiaryFormData>({
    resolver: zodResolver(apiariesSchema),
    defaultValues: {
      name: '',
      location: '',
    },
  });

  const onSubmit = async (data: ApiaryFormData) => {
    if (onSubmitOverride) {
      onSubmitOverride(data);
      return;
    }
    try {
      await mutateAsync({
        name: data.name,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      navigate('/'); // Navigate to home page or apiary list
    } catch (error) {
      console.error('Failed to create apiary', error);
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
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Apiary name" />
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
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Location description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <MapPicker
          onLocationSelect={({ latitude, longitude }) => {
            form.setValue('latitude', latitude);
            form.setValue('longitude', longitude);
          }}
        />
        <div className="flex justify-end">
          <Button
            variant="outline"
            className="mr-2"
            onClick={() => navigate('/')}
          >
            Cancel
          </Button>
          <Button disabled={isLoading} type={'submit'}>
            {'Create Apiary'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
