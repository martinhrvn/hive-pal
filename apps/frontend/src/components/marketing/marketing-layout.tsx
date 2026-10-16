import { preconnect } from 'react-dom';
import { MarketingFooter, MarketingHeader } from './marketing-chrome';

const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,300..800&family=Manrope:wght@300;400;500;600;700&display=swap';

/**
 * Page shell for the public marketing pages: always-light cream canvas,
 * header and footer. Loads the marketing typefaces here (React hoists the
 * stylesheet into <head>), so app routes don't pay for them.
 */
export function MarketingLayout({ children }: { children: React.ReactNode }) {
  preconnect('https://fonts.googleapis.com');
  preconnect('https://fonts.gstatic.com', { crossOrigin: 'anonymous' });
  return (
    <div className="min-h-screen w-full bg-cream font-marketing text-stone-900 antialiased selection:bg-amber-200 selection:text-stone-900">
      <link rel="stylesheet" href={FONTS_URL} precedence="default" />
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
