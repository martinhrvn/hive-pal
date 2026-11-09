import { MarketingFooter, MarketingHeader } from './marketing-chrome';

/**
 * Page shell for the public marketing pages: always-light cream canvas,
 * header and footer.
 *
 * The marketing typefaces (Bricolage Grotesque, Manrope) are self-hosted from
 * `/fonts` and declared in `index.css`; the browser only downloads the subset a
 * page actually needs, and no visitor request goes to Google.
 */
export function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen w-full bg-cream font-marketing text-stone-900 antialiased selection:bg-amber-200 selection:text-stone-900">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
