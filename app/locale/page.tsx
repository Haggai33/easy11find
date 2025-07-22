'use client';

import { useCurrentUser, useIsLoading } from '@/hooks/useStore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home as HomeIcon, Plus, Search, User } from 'lucide-react';

export default function Home() {
  const user = useCurrentUser();
  const isLoading = useIsLoading();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    // User is logged in, redirect to dashboard
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome back, {user.email}!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Ready to continue your apartment search?
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-3">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // User is not logged in, show homepage
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HomeIcon className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">EasyFind</h1>
            </div>
            <div className="flex gap-3">
              <Link href="/login">
                <Button variant="outline">Log In</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Find Your Perfect Apartment
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create detailed listings, track apartments, and make informed decisions with our comprehensive apartment hunting platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create">
              <Button size="lg" className="text-lg px-8 py-3">
                <Plus className="w-5 h-5 mr-2" />
                Create Listing
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                <Search className="w-5 h-5 mr-2" />
                Start Searching
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Plus className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Create Custom Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Build detailed apartment listings with customizable fields to highlight what makes your property special.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Search className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Track & Compare</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Save apartments to your personal dashboard and compare them with detailed checklists and ratings.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <User className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Make Informed Decisions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Rate different aspects, add notes, and organize your thoughts to find the perfect apartment.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-lg text-gray-600 mb-6">
            Join thousands of users who have found their perfect apartment with EasyFind.
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8 py-3">
              Create Free Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}