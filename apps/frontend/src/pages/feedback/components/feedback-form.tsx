import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useState } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import {
  createFeedbackSchema,
  CreateFeedbackDto,
  FeedbackType,
} from 'shared-schemas';

export type FeedbackFormData = CreateFeedbackDto;

interface FeedbackFormProps {
  onSubmit: (data: FeedbackFormData) => Promise<void>;
  isLoading?: boolean;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const { t } = useTranslation(['common']);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(createFeedbackSchema),
    defaultValues: {
      email: '',
      type: FeedbackType.SUGGESTION,
      subject: '',
      message: '',
    },
  });

  const handleSubmit = async (data: FeedbackFormData) => {
    try {
      await onSubmit(data);
      setIsSubmitted(true);
      form.reset();
      // Reset submitted state after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h3 className="text-xl font-semibold">{t('feedback.thankYou')}</h3>
            <p className="text-muted-foreground text-center">
              {t('feedback.submittedMessage')}
            </p>
            <Button onClick={() => setIsSubmitted(false)} variant="outline">
              {t('feedback.submitAnother')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('feedback.title')}</CardTitle>
        <CardDescription>{t('feedback.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('feedback.type')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('feedback.selectType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={FeedbackType.BUG}>
                        {t('feedback.typeBug')}
                      </SelectItem>
                      <SelectItem value={FeedbackType.SUGGESTION}>
                        {t('feedback.typeSuggestion')}
                      </SelectItem>
                      <SelectItem value={FeedbackType.OTHER}>
                        {t('feedback.typeOther')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('feedback.subject')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('feedback.subjectPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('feedback.message')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('feedback.messagePlaceholder')}
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('feedback.email')}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t('feedback.emailPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('feedback.emailDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isLoading}
              >
                {t('actions.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('feedback.submit')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
