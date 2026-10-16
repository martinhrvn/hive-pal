import { Link } from 'react-router-dom';
import { ArrowUpRight, Rocket } from 'lucide-react';
import { GithubIcon } from '@/components/icons/github-icon';
import { cn } from '@/lib/utils';
import { MarketingButton } from './marketing-button';
import { GITHUB_URL, MARKETING_FOCUS } from './marketing-constants';
import { HexBullet } from './marketing-chrome';

const HEADING_SIZE = {
  md: 'text-3xl leading-[1.06] sm:text-4xl',
  lg: 'text-4xl leading-[1.05] sm:text-5xl',
  xl: 'text-4xl leading-[1.05] sm:text-6xl',
} as const;

/** Section heading in the marketing display face. */
export function MarketingHeading({
  size = 'lg',
  className,
  children,
}: {
  size?: keyof typeof HEADING_SIZE;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      className={cn(
        'font-marketing-display tracking-tight',
        HEADING_SIZE[size],
        className,
      )}
    >
      {children}
    </h2>
  );
}

/** Faint hexagon tiling behind a section. */
export function HexPattern({ tone }: { tone: 'light' | 'dark' }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute inset-0',
        tone === 'light'
          ? 'bg-hex-light opacity-[0.05]'
          : 'bg-hex-dark opacity-[0.06]',
      )}
    />
  );
}

/** Underlined text link with a trailing arrow ("See all ↗"). */
export function ArrowLink({
  to,
  className,
  children,
}: {
  to: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        MARKETING_FOCUS,
        'inline-flex items-center gap-2 text-sm font-medium text-stone-900 underline-offset-4 hover:underline',
        className,
      )}
    >
      {children}
      <ArrowUpRight className="size-4" />
    </Link>
  );
}

/** One feature in a `<dl>`: hex bullet and rule, then title and body. */
export function FeatureItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="group relative">
      <div className="flex items-center gap-3">
        <HexBullet />
        <span className="h-px flex-1 bg-stone-900/10 transition-colors group-hover:bg-amber-700/40" />
      </div>
      <dt className="mt-3 text-lg font-semibold text-stone-900">{title}</dt>
      <dd className="mt-2 text-sm leading-relaxed text-stone-600">{body}</dd>
    </div>
  );
}

/**
 * The sign-up + GitHub button pair.
 * - `heroOnImage`: amber sign-up over the hero photo
 * - `hero`: dark sign-up on cream
 * - `closing`: end-of-page call to action with a trailing arrow
 */
export function MarketingCtas({
  variant,
  signupLabel,
  githubLabel,
}: {
  variant: 'heroOnImage' | 'hero' | 'closing';
  signupLabel: string;
  githubLabel: string;
}) {
  const onImage = variant === 'heroOnImage';
  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
      <MarketingButton size="lg" variant={onImage ? 'primary' : 'dark'} asChild>
        <Link to="/register">
          {variant !== 'closing' && <Rocket className="size-4" />}
          {signupLabel}
          {variant === 'closing' && <ArrowUpRight className="size-4" />}
        </Link>
      </MarketingButton>
      <MarketingButton
        size="lg"
        variant={onImage ? 'outlineOnImage' : 'outline'}
        asChild
      >
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          <GithubIcon className="size-4" />
          {githubLabel}
        </a>
      </MarketingButton>
    </div>
  );
}
