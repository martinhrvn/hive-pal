import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
            Apiary Assistant
          </CardTitle>
          <CardDescription>
            Ask comparative questions across all hives in
            {activeApiary ? ` ${activeApiary.name}` : ' your apiary'} — e.g.
            which hives need feeding first, or where swarm risk is highest this
            week.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeApiaryId ? (
            <AssistantChat apiaryId={activeApiaryId} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Select an apiary to start chatting with the assistant.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
