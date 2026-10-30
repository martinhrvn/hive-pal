import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { BotMessageSquare } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AssistantChat } from '@/components/assistant/assistant-chat';
import { useApiary } from '@/hooks/use-apiary';
import { useFeatures } from '@/api/hooks/useFeatures';

export function AssistantPage() {
  const { t } = useTranslation('ai');
  const navigate = useNavigate();
  const { activeApiaryId, activeApiary } = useApiary();
  const { data: features, isLoading } = useFeatures();

  // If AI is disabled, the page should not be reachable — bounce home.
  useEffect(() => {
    if (!isLoading && features && !features.aiEnabled) {
      navigate('/');
    }
  }, [features, isLoading, navigate]);

  if (features && !features.aiEnabled) {
    return null;
  }

  return (
    <div className="p-2 sm:p-4 max-w-3xl mx-auto w-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BotMessageSquare className="h-5 w-5 text-amber-600" />
            {t('assistant.page.title')}
          </CardTitle>
          <CardDescription>
            {activeApiary
              ? t('assistant.page.description', { apiary: activeApiary.name })
              : t('assistant.page.descriptionNoApiary')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeApiaryId ? (
            <AssistantChat apiaryId={activeApiaryId} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('assistant.page.selectApiary')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
