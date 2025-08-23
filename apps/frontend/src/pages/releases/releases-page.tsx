import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useReleaseNotes } from '@/hooks/use-release-notes';

export function ReleasesPage() {
  const { t } = useTranslation('common');
  const { releaseNotes, loadReleaseNotes, isLoading } = useReleaseNotes();

  useEffect(() => {
    loadReleaseNotes();
  }, [loadReleaseNotes]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <p>{t('status.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('releaseNotes.title')}
        </h1>
        <p className="text-gray-600">
          Stay up to date with the latest features, improvements, and bug fixes in HivePal.
        </p>
      </div>

      <div className="space-y-8">
        {releaseNotes.map((release, index) => (
          <Card key={release.version} className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <Badge 
                  variant={index === 0 ? "default" : "secondary"}
                  className={index === 0 ? "bg-blue-600 text-white" : ""}
                >
                  v{release.version}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {release.releaseDate}
                </span>
                {index === 0 && (
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    Latest
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className="release-notes-content prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: release.htmlContent }} 
              />
              {index < releaseNotes.length - 1 && (
                <Separator className="mt-8" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {releaseNotes.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-500">No release notes available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}