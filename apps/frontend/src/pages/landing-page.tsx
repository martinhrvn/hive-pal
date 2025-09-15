import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Github, BookOpen, Rocket } from 'lucide-react';

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
              <span className="ml-3 text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Open Source
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a
                href="https://docs.hivepal.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm font-medium"
              >
                <BookOpen className="h-4 w-4" />
                Documentation
              </a>
              <Link
                to="/releases"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Release Notes
              </Link>
              <a
                href="https://github.com/martinhrvn/hive-pal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm font-medium"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </nav>
            <div className="flex space-x-4">
              <Button variant="outline" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-amber-500 hover:bg-amber-600">
                <Link to="/register">Start Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-[url('/hero3.jpg')]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/20"></div>
        <div className="relative z-10 text-center px-4 py-8 max-w-5xl mx-auto">
          <div className="backdrop-blur-sm bg-black/20 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-4xl sm:text-6xl font-bold mb-6 text-white drop-shadow-lg">
              Your Open Source
              <span className="text-amber-400"> Beekeeping </span>
              Companion
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto text-white/95 drop-shadow-md">
              Free and open-source beekeeping management platform. Self-host on
              your own infrastructure or use our hosted service. Manage
              apiaries, track hive health, schedule inspections, and monitor
              harvests.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                asChild
                className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg"
              >
                <Link to="/register">
                  <Rocket className="mr-2 h-5 w-5" />
                  Start Free (Early Adopter)
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="border-white bg-white/10 text-white hover:bg-white hover:text-black backdrop-blur-sm"
              >
                <a
                  href="https://github.com/martinhrvn/hive-pal"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="mr-2 h-5 w-5" />
                  Self-Host
                </a>
              </Button>
            </div>
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

      {/* Open Source & Pricing Section */}
      <section className="bg-gradient-to-r from-amber-50 to-yellow-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-amber-600">
              Open Source & Transparent Pricing
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Choose the option that works best for you
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-6xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Self-Hosted Option */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <svg
                      className="h-6 w-6 text-blue-300"
                      role="img"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <title>GitHub</title>
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Self-Hosted
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                    Always Free
                  </span>
                </div>

                <p className="text-gray-600 mb-6">
                  Full control over your data and infrastructure. Perfect for
                  teams who want complete ownership and customization.
                </p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">
                      100% open source (MIT License)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Host on your own servers
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Complete data ownership
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">Community support</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">Docker ready</span>
                  </li>
                </ul>

                <Button variant="outline" size="lg" className="w-full" asChild>
                  <a
                    href="https://github.com/martinhrvn/hive-pal"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BookOpen className="mr-2 h-5 w-5" />
                    View Documentation
                  </a>
                </Button>
              </div>

              {/* Hosted Option */}
              <div className="rounded-2xl border-2 border-amber-500 bg-white p-8 shadow-lg relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-amber-500 px-4 py-1 text-sm font-semibold text-white">
                    Early Adopter Offer
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-6 mt-2">
                  <div className="rounded-lg bg-amber-100 p-2">
                    <Rocket className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Cloud Hosted
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                    Free Now
                  </span>
                </div>

                <p className="text-gray-600 mb-6">
                  Zero setup required. We handle everything so you can focus on
                  your bees. Premium features and support included.
                </p>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Instant setup, no maintenance
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Automatic updates & backups
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">Priority support</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">99.9% uptime SLA</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">Early features access</span>
                  </li>
                </ul>

                <div className="bg-amber-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-amber-900">
                    <strong>Currently free for early adopters!</strong> Sign up
                    now to lock in special pricing when we launch our premium
                    plans. Early adopters will receive lifetime benefits.
                  </p>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-amber-500 hover:bg-amber-600"
                  asChild
                >
                  <Link to="/register">Start Free Today</Link>
                </Button>
              </div>
            </div>
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
            Join the growing community of beekeepers using Hive Pal. Whether
            self-hosted or cloud-based, we have the perfect solution for you.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Start Free (Cloud)</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 hover:bg-white hover:text-amber-600 text-white border-white"
              asChild
            >
              <a
                href="https://github.com/martinhrvn/hive-pal"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
              </a>
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
              <span className="ml-2 text-xs font-medium bg-gray-800 text-green-400 px-2 py-1 rounded-full">
                Open Source
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-6 mb-6">
              Free and open-source beekeeping management platform. Making
              beekeeping simpler, more productive, and more enjoyable.
            </p>

            <div className="flex justify-center space-x-6 mb-8">
              <a
                href="https://docs.hivepal.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm"
              >
                Documentation
              </a>
              <Link
                to="/releases"
                className="text-gray-400 hover:text-white text-sm"
              >
                Release Notes
              </Link>
              <a
                href="https://github.com/martinhrvn/hive-pal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <a
                href="https://github.com/martinhrvn/hive-pal/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm"
              >
                Report Issue
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-8">
            <p className="text-sm leading-5 text-gray-400 text-center">
              © 2025 Hive Pal. Released under MIT License. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
