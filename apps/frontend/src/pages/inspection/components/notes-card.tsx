import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type NotesCardProps = {
  notes?: string | null;
};

export const NotesCard = ({ notes }: NotesCardProps) => {
  if (!notes) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{notes}</p>
      </CardContent>
    </Card>
  );
};
