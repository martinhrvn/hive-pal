import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Github, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalizedPath } from '@/hooks/use-language-navigation';
import { sans } from './marketing-styles';

/** Amber hexagon bullet used in feature lists. */
export function HexBullet({ className = 'h-3.5 w-3.5 text-amber-600' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`flex-none ${className}`}
    >
      <path
        d="M12 2.5l8.66 5v9l-8.66 5-8.66-5v-9l8.66-5z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M12 2.5l8.66 5v9l-8.66 5-8.66-5v-9l8.66-5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

/** Uppercase eyebrow label with a leading amber rule. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-stone-600"
      style={sans}
    >
      <span className="h-px w-8 bg-amber-600/70" />
      <span>{children}</span>
    </div>
  );
}

/** Sticky top navigation shared across the public marketing pages. */
export function MarketingHeader() {
  const localize = useLocalizedPath();
  const { t } = useTranslation('common');
  return (
    <header className="sticky top-0 z-40 border-b border-stone-900/10 bg-[#FBF5EA]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link to={localize('/')} className="flex items-center gap-3">
          <img
            src="/hive-pal-logo.png"
            alt="Hive Pal"
            className="h-9 w-9 select-none"
            draggable={false}
          />
          <span
            className="text-lg font-semibold tracking-tight text-stone-900"
            style={sans}
          >
            Hive Pal
          </span>
        </Link>

        <nav
          className="hidden items-center gap-8 text-sm text-stone-700 md:flex"
          style={sans}
        >
          <Link
            to={localize('/features')}
            className="transition-colors hover:text-stone-900"
          >
            {t('marketing.nav.features')}
          </Link>
          <Link
            to={localize('/tools')}
            className="transition-colors hover:text-stone-900"
          >
            {t('marketing.nav.freeTools')}
          </Link>
          <a
            href="https://docs.hivepal.app"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-stone-900"
          >
            {t('marketing.nav.documentation')}
          </a>
          <Link
            to={localize('/releases')}
            className="transition-colors hover:text-stone-900"
          >
            {t('marketing.nav.releaseNotes')}
          </Link>
          <a
            href="https://github.com/martinhrvn/hive-pal"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-stone-900"
          >
            <Github className="h-4 w-4" />
            {t('marketing.nav.github')}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            asChild
            className="hidden text-stone-700 hover:bg-stone-900/5 hover:text-stone-900 sm:inline-flex"
          >
            <Link to="/login">{t('marketing.nav.signIn')}</Link>
          </Button>
          <Button
            asChild
            className="bg-stone-900 text-amber-50 shadow-sm hover:bg-stone-800"
          >
            <Link to="/register">
              {t('marketing.nav.startFree')}
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/** Dark footer shared across the public marketing pages. */
export function MarketingFooter() {
  const localize = useLocalizedPath();
  const { t } = useTranslation('common');
  return (
    <footer className="bg-[#15201E] text-amber-50/80">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link to={localize('/')} className="flex items-center gap-3">
              <img src="/hive-pal-logo.png" alt="Hive Pal" className="h-9 w-9" />
              <span
                className="text-lg font-semibold text-amber-50"
                style={sans}
              >
                Hive Pal
              </span>
            </Link>
            <p
              className="mt-5 max-w-xs text-sm leading-relaxed text-amber-50/65"
              style={sans}
            >
              {t('marketing.footer.tagline')}
            </p>
          </div>

          <div>
            <p
              className="text-[11px] uppercase tracking-[0.22em] text-amber-200/60"
              style={sans}
            >
              {t('marketing.footer.product')}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  to={localize('/features')}
                  className="text-amber-50/75 hover:text-amber-50"
                >
                  {t('marketing.footer.features')}
                </Link>
              </li>
              <li>
                <Link
                  to={localize('/tools')}
                  className="text-amber-50/75 hover:text-amber-50"
                >
                  {t('marketing.footer.freeTools')}
                </Link>
              </li>
              <li>
                <Link
                  to={localize('/releases')}
                  className="text-amber-50/75 hover:text-amber-50"
                >
                  {t('marketing.footer.releaseNotes')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p
              className="text-[11px] uppercase tracking-[0.22em] text-amber-200/60"
              style={sans}
            >
              {t('marketing.footer.project')}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href="https://docs.hivepal.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-50/75 hover:text-amber-50"
                >
                  {t('marketing.footer.documentation')}
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/martinhrvn/hive-pal/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-50/75 hover:text-amber-50"
                >
                  {t('marketing.footer.reportIssue')}
                </a>
              </li>
              <li>
                <Link
                  to={localize('/privacy-policy')}
                  className="text-amber-50/75 hover:text-amber-50"
                >
                  {t('marketing.footer.privacyPolicy')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p
              className="text-[11px] uppercase tracking-[0.22em] text-amber-200/60"
              style={sans}
            >
              {t('marketing.footer.source')}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href="https://github.com/martinhrvn/hive-pal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-amber-50/75 hover:text-amber-50"
                >
                  <Github className="h-4 w-4" />
                  {t('marketing.footer.github')}
                </a>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-amber-50/75 hover:text-amber-50"
                >
                  {t('marketing.footer.signIn')}
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-amber-50/75 hover:text-amber-50"
                >
                  {t('marketing.footer.createAccount')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-amber-50/10 pt-8 sm:flex-row">
          <p
            className="text-[11px] uppercase tracking-[0.22em] text-amber-50/55"
            style={sans}
          >
            {t('marketing.footer.copyright')}
          </p>
          <p className="text-xs text-amber-50/55">
            {t('marketing.footer.builtWith')}
          </p>
        </div>
      </div>
    </footer>
  );
}
