import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import { GithubIcon } from '@/components/icons/github-icon';
import { cn } from '@/lib/utils';
import { useLocalizedPath } from '@/hooks/use-language-navigation';
import { LanguageMenu } from '@/components/language-menu';
import { MarketingButton } from './marketing-button';
import { DOCS_URL, GITHUB_URL, MARKETING_FOCUS } from './marketing-constants';

const HEX_PATH = 'M12 2.5l8.66 5v9l-8.66 5-8.66-5v-9l8.66-5z';

/** Hexagon bullet used in feature lists; colour it with a text-* class. */
export function HexBullet({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn('size-3.5 flex-none text-amber-600', className)}
    >
      <path d={HEX_PATH} fill="currentColor" opacity="0.18" />
      <path d={HEX_PATH} fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

/** Uppercase eyebrow label with a leading rule, for cream or forest sections. */
export function SectionLabel({
  children,
  tone = 'light',
}: Readonly<{
  children: React.ReactNode;
  tone?: 'light' | 'dark';
}>) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em]',
        tone === 'light' ? 'text-stone-600' : 'text-amber-200/80',
      )}
    >
      <span
        className={cn(
          'h-px w-8',
          tone === 'light' ? 'bg-amber-600/70' : 'bg-amber-300/70',
        )}
      />
      <span>{children}</span>
    </div>
  );
}

/** The Hive Pal mark, 36 px tall; the 112 px source covers high-DPI screens. */
function Logo({ className }: Readonly<{ className?: string }>) {
  const { t } = useTranslation('common');
  return (
    <picture>
      <source srcSet="/hive-pal-logo-112.webp" type="image/webp" />
      <img
        src="/hive-pal-logo-112.png"
        alt={t('marketing.brand')}
        width={32}
        height={36}
        className={cn('h-9 w-auto select-none', className)}
        draggable={false}
      />
    </picture>
  );
}

type NavLink = { label: string; icon?: React.ReactNode } & (
  { to: string } | { href: string }
);

/** A footer or header link: internal routes via Link, external in a new tab. */
function MarketingNavLink({
  link,
  className,
}: Readonly<{
  link: NavLink;
  className: string;
}>) {
  const content = (
    <>
      {link.icon}
      {link.label}
    </>
  );
  if ('to' in link) {
    return (
      <Link to={link.to} className={cn(MARKETING_FOCUS, className)}>
        {content}
      </Link>
    );
  }
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(MARKETING_FOCUS, className)}
    >
      {content}
    </a>
  );
}

/** Sticky top navigation shared across the public marketing pages. */
export function MarketingHeader() {
  const localize = useLocalizedPath();
  const { t } = useTranslation('common');
  const links: NavLink[] = [
    { label: t('marketing.nav.features'), to: localize('/features') },
    { label: t('marketing.nav.freeTools'), to: localize('/tools') },
    { label: t('marketing.nav.documentation'), href: DOCS_URL },
    { label: t('marketing.nav.releaseNotes'), to: localize('/releases') },
  ];
  const linkClass = 'transition-colors hover:text-stone-900';

  return (
    <header className="sticky top-0 z-40 border-b border-stone-900/10 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link
          to={localize('/')}
          className={cn(MARKETING_FOCUS, 'flex items-center gap-3')}
        >
          <Logo />
          <span className="text-lg font-semibold tracking-tight text-stone-900">
            {t('marketing.brand')}
          </span>
        </Link>

        <nav
          aria-label={t('marketing.nav.ariaLabel')}
          className="hidden items-center gap-8 text-sm text-stone-700 md:flex"
        >
          {links.map(link => (
            <MarketingNavLink
              key={link.label}
              link={link}
              className={linkClass}
            />
          ))}
          <MarketingNavLink
            link={{
              label: t('marketing.nav.github'),
              href: GITHUB_URL,
              icon: <GithubIcon className="size-4" />,
            }}
            className={cn(linkClass, 'inline-flex items-center gap-1.5')}
          />
        </nav>

        <div className="flex items-center gap-2">
          <LanguageMenu className="text-stone-700 hover:bg-stone-900/5 hover:text-stone-900" />
          <MarketingButton
            variant="ghost"
            asChild
            className="hidden sm:inline-flex"
          >
            <Link to="/login">{t('marketing.nav.signIn')}</Link>
          </MarketingButton>
          <MarketingButton variant="dark" asChild className="shadow-sm">
            <Link to="/register">
              {t('marketing.nav.startFree')}
              <ArrowUpRight className="size-4" />
            </Link>
          </MarketingButton>
        </div>
      </div>
    </header>
  );
}

const FOOTER_LINK = 'text-amber-50/75 transition-colors hover:text-amber-50';

/** Dark footer shared across the public marketing pages. */
export function MarketingFooter() {
  const localize = useLocalizedPath();
  const { t } = useTranslation('common');
  const columns: { title: string; links: NavLink[] }[] = [
    {
      title: t('marketing.footer.product'),
      links: [
        { label: t('marketing.footer.features'), to: localize('/features') },
        { label: t('marketing.footer.freeTools'), to: localize('/tools') },
        {
          label: t('marketing.footer.releaseNotes'),
          to: localize('/releases'),
        },
      ],
    },
    {
      title: t('marketing.footer.project'),
      links: [
        { label: t('marketing.footer.documentation'), href: DOCS_URL },
        {
          label: t('marketing.footer.reportIssue'),
          href: `${GITHUB_URL}/issues`,
        },
        {
          label: t('marketing.footer.privacyPolicy'),
          to: localize('/privacy-policy'),
        },
      ],
    },
    {
      title: t('marketing.footer.source'),
      links: [
        {
          label: t('marketing.footer.github'),
          href: GITHUB_URL,
          icon: <GithubIcon className="size-4" />,
        },
        { label: t('marketing.footer.signIn'), to: '/login' },
        { label: t('marketing.footer.createAccount'), to: '/register' },
      ],
    },
  ];

  return (
    <footer className="bg-forest text-amber-50/80">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link
              to={localize('/')}
              className={cn(MARKETING_FOCUS, 'inline-flex items-center gap-3')}
            >
              <Logo />
              <span className="text-lg font-semibold text-amber-50">
                {t('marketing.brand')}
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-amber-50/65">
              {t('marketing.footer.tagline')}
            </p>
          </div>

          {columns.map(column => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-xs uppercase tracking-[0.22em] text-amber-200/60">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {column.links.map(link => (
                  <li key={link.label}>
                    <MarketingNavLink
                      link={link}
                      className={cn(
                        FOOTER_LINK,
                        link.icon && 'inline-flex items-center gap-1.5',
                      )}
                    />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-amber-50/10 pt-8 sm:flex-row">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-50/55">
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
