import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-green-50 w-full">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-amber-600">🐝</div>
              <h1 className="ml-2 text-xl font-semibold text-gray-900">
                Hive Pal
              </h1>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center">
        <div className="absolute inset-0 bg-cover bg-center bg-[url('/hero3.jpg')]"></div>
        <div className="absolute inset-0 bg-black opacity-25"></div>3
        <div className="relative z-10 text-center px-4">
          <h2
            className="text-4xl sm:text-6xl font-bold mb-6 text-white"
            style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}
          >
            Your Digital
            <span className="text-amber-400"> Beekeeping </span>
            Companion
          </h2>
          <p
            className="text-xl mb-8 max-w-3xl mx-auto text-white shadow-xl"
            style={{ textShadow: '1px 1px 3px rgba(0, 0, 0, 0.5)' }}
          >
            Manage your apiaries, track hive health, schedule inspections, and
            monitor harvests all in one comprehensive beekeeping management
            platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="bg-amber-500 hover:bg-amber-600"
            >
              <Link to="/register">Start Managing Your Hives</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-white text-amber-800 hover:bg-white hover:text-black"
            >
              <Link to="/login">Sign In to Your Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-amber-600">
              Modern Beekeeping
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to manage your hives
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Professional tools designed by beekeepers, for beekeepers to
              ensure healthy and productive colonies.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0l8.954 8.955M2.25 12l8.954 8.955a1.5 1.5 0 002.122 0l8.954-8.955M2.25 12h19.5"
                      />
                    </svg>
                  </div>
                  Apiary Management
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Organize and track multiple apiaries with detailed location
                  information, weather data, and site-specific notes.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  Hive Inspections
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Schedule and record detailed hive inspections with
                  customizable checklists, photos, and health assessments.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                      />
                    </svg>
                  </div>
                  Queen Tracking
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Monitor queen performance, breeding records, and replacement
                  schedules to maintain strong colonies.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0l.879-.659M7.5 14.25l-2.489-1.867a.75.75 0 01.02-1.263l2.489-1.867M16.5 14.25l2.489-1.867a.75.75 0 00-.02-1.263l-2.489-1.867"
                      />
                    </svg>
                  </div>
                  Harvest Management
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Track honey production, processing dates, and yields across
                  different seasons and hive locations.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-amber-500">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl text-center">
            Ready to Transform Your Beekeeping?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-amber-100 text-center">
            Join thousands of beekeepers who trust Hive Pal to manage their
            operations. Sign up for a free account today and experience the
            future of beekeeping management.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Create Your Free Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="text-2xl font-bold text-amber-400">🐝</div>
              <span className="ml-2 text-lg font-semibold">Hive Pal</span>
            </div>
            <p className="text-gray-400 text-sm leading-6">
              Professional beekeeping management platform. Making beekeeping
              simpler, more productive, and more enjoyable.
            </p>
          </div>
          <div className="mt-8 border-t border-white/10 pt-8">
            <p className="text-sm leading-5 text-gray-400 text-center">
              © 2025 Hive Pal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
