import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import type { QueenFormValues } from './queen-form-schema';

const FRAME_CLASS = 'container mx-auto max-w-2xl p-4';

/** Card, form element and footer shared by the create and edit forms. */
export const QueenFormFrame = ({
  title,
  form,
  onSubmit,
  submitLabel,
  submitEvent,
  cancelTo,
  children,
}: {
  title: string;
  form: UseFormReturn<QueenFormValues>;
  onSubmit: (values: QueenFormValues) => Promise<void>;
  submitLabel: string;
  /** Umami analytics event name. */
  submitEvent: string;
  cancelTo: string;
  children: ReactNode;
}) => {
  const { t } = useTranslation('common');
  const { isSubmitting } = form.formState;

  return (
    <div className={FRAME_CLASS}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {children}
              <div className="flex justify-end gap-2 border-t pt-6">
                <Button variant="outline" asChild>
                  <Link to={cancelTo}>{t('actions.cancel')}</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  data-umami-event={submitEvent}
                >
                  {submitLabel}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export const QueenFormSkeleton = () => (
  <div className={FRAME_CLASS}>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-6">
        {[0, 1, 2].map(section => (
          <div key={section} className="space-y-4">
            <Skeleton className="h-3 w-24" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);
