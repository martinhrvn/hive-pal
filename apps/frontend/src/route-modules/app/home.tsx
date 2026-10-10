import { HomePage } from '@/pages/home-page';

// `/` doubles as the prerendered, logged-out landing page (ProtectedRoute
// renders it in place of this component), which sets its own head tags, so
// the site-wide defaults are dropped here and the dashboard home sets its own
// title instead.
export const meta = () => [];

export default function Home() {
  return (
    <>
      <title>Hive Pal - Modern Beekeeping Management Software</title>
      <HomePage />
    </>
  );
}
