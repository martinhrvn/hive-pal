import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

type NotesCardProps = {
  notes?: string | null;
};

export const NotesCard = ({ notes }: NotesCardProps) => {
  const { t } = useTranslation('inspection');
  if (!notes) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('inspection:notesCard.title')}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{notes}</p>
      </CardContent>
    </Card>
  );
};
