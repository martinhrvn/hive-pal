import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useReleaseNotes } from '@/hooks/use-release-notes';
import { ArrowLeft, Home } from 'lucide-react';
import { GithubIcon } from '@/components/icons/github-icon';
import { PublicMeta } from '@/components/seo/public-meta';
import { useLocalizedPath } from '@/hooks/use-language-navigation';

export function ReleasesPage() {
  const { t } = useTranslation('common');
  const localize = useLocalizedPath();
  const { releaseNotes, loadReleaseNotes, isLoading } = useReleaseNotes();

  useEffect(() => {
    loadReleaseNotes();
  }, [loadReleaseNotes]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-green-50">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center">
            <p>{t('status.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-green-50 w-full">
      <PublicMeta
        title={t('releasesPage.meta.title')}
        description={t('releasesPage.meta.description')}
        path="/releases"
      />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link
                to={localize('/')}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <div className="text-2xl font-bold text-amber-600">🐝</div>
                <h1 className="ml-2 text-xl font-semibold text-gray-900">
                  {t('releasesPage.brand')}
                </h1>
              </Link>
              <span className="ml-3 text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                {t('releasesPage.openSource')}
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to={localize('/')}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center gap-1"
              >
                <Home className="h-4 w-4" />
                {t('releasesPage.home')}
              </Link>
              <a
                href="https://github.com/martinhrvn/hive-pal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm font-medium"
              >
                <GithubIcon className="h-4 w-4" />
                {t('releasesPage.github')}
              </a>
            </nav>
            <div className="flex space-x-4">
              <Button variant="outline" asChild>
                <Link to="/login">{t('releasesPage.signIn')}</Link>
              </Button>
              <Button asChild className="bg-amber-500 hover:bg-amber-600">
                <Link to="/register">{t('releasesPage.startFree')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 max-w-4xl px-4 min-h-[60vh]">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            to={localize('/')}
            className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1 inline-flex"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('releasesPage.backToHome')}
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('releasesPage.title')}
          </h1>
          <p className="text-gray-600">
            <Trans
              t={t}
              i18nKey="releasesPage.intro"
              components={{
                githubLink: (
                  <a
                    href="https://github.com/martinhrvn/hive-pal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:text-amber-700 underline"
                  />
                ),
              }}
            />
          </p>
        </div>

        <div className="space-y-8">
          {releaseNotes.map((release, index) => (
            <Card key={release.version} className="shadow-sm bg-white">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <Badge
                    variant={index === 0 ? 'default' : 'secondary'}
                    className={index === 0 ? 'bg-blue-600 text-white' : ''}
                  >
                    {t('releasesPage.versionBadge', {
                      version: release.version,
                    })}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {release.releaseDate}
                  </span>
                  {index === 0 && (
                    <Badge
                      variant="outline"
                      className="text-green-700 border-green-300"
                    >
                      {t('releasesPage.latest')}
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
          <Card className="text-center py-12 bg-white">
            <CardContent>
              <p className="text-gray-500">{t('releasesPage.empty')}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="text-2xl font-bold text-amber-400">🐝</div>
              <span className="ml-2 text-lg font-semibold">
                {t('releasesPage.brand')}
              </span>
              <span className="ml-2 text-xs font-medium bg-gray-800 text-green-400 px-2 py-1 rounded-full">
                {t('releasesPage.openSource')}
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-6 mb-6">
              {t('releasesPage.footer.tagline')}
            </p>

            <div className="flex justify-center space-x-6 mb-8">
              <Link
                to={localize('/')}
                className="text-gray-400 hover:text-white text-sm"
              >
                {t('releasesPage.home')}
              </Link>
              <a
                href="https://github.com/martinhrvn/hive-pal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
              >
                <GithubIcon className="h-4 w-4" />
                {t('releasesPage.github')}
              </a>
              <a
                href="https://github.com/martinhrvn/hive-pal/wiki"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm"
              >
                {t('releasesPage.footer.documentation')}
              </a>
              <a
                href="https://github.com/martinhrvn/hive-pal/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm"
              >
                {t('releasesPage.footer.reportIssue')}
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-8">
            <p className="text-sm leading-5 text-gray-400 text-center">
              {t('releasesPage.footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
