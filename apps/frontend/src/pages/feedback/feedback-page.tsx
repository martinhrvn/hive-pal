import { FeedbackForm, FeedbackFormData } from './components/feedback-form';
import { useSubmitFeedback } from '@/api/hooks/useFeedback';
import { useTranslation } from 'react-i18next';

export function FeedbackPage() {
  const { t } = useTranslation(['common']);
  const { mutateAsync: submitFeedback, isPending } = useSubmitFeedback();

  const handleSubmit = async (data: FeedbackFormData) => {
    await submitFeedback(data);
  };

  return (
    <div className="container mx-auto py-8">
      <FeedbackForm onSubmit={handleSubmit} isLoading={isPending} />
    </div>
  );
}