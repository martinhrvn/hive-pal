import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Your Digital
            <span className="text-amber-600"> Beekeeping </span>
            Companion
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Manage your apiaries, track hive health, schedule inspections, and
            monitor harvests all in one comprehensive beekeeping management
            platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/register">Start Managing Your Hives</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/login">Sign In to Your Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Everything You Need for Modern Beekeeping
          </h3>
          <p className="text-lg text-gray-600">
            Professional tools designed by beekeepers, for beekeepers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">🏠</div>
            <h4 className="text-xl font-semibold mb-3">Apiary Management</h4>
            <p className="text-gray-600">
              Organize and track multiple apiaries with detailed location
              information, weather data, and site-specific notes.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">📋</div>
            <h4 className="text-xl font-semibold mb-3">Hive Inspections</h4>
            <p className="text-gray-600">
              Schedule and record detailed hive inspections with customizable
              checklists, photos, and health assessments.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">👑</div>
            <h4 className="text-xl font-semibold mb-3">Queen Tracking</h4>
            <p className="text-gray-600">
              Monitor queen performance, breeding records, and replacement
              schedules to maintain strong colonies.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">🍯</div>
            <h4 className="text-xl font-semibold mb-3">Harvest Management</h4>
            <p className="text-gray-600">
              Track honey production, processing dates, and yields across
              different seasons and hive locations.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">🔧</div>
            <h4 className="text-xl font-semibold mb-3">Equipment Planning</h4>
            <p className="text-gray-600">
              Manage your beekeeping equipment inventory, maintenance schedules,
              and replacement planning.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">📊</div>
            <h4 className="text-xl font-semibold mb-3">Analytics & Reports</h4>
            <p className="text-gray-600">
              Gain insights into your operation with detailed analytics, trends,
              and customizable reports.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-amber-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">
              Ready to Transform Your Beekeeping?
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of beekeepers who trust Hive Pal to manage their
              operations.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Create Your Free Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="text-2xl font-bold text-amber-400">🐝</div>
              <span className="ml-2 text-lg font-semibold">Hive Pal</span>
            </div>
            <div className="text-sm text-gray-400">
              © 2025 Hive Pal. Professional beekeeping management platform.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
