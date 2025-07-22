// /app/(protected)/dashboard/page.tsx
import DashboardClient from '@/components/dashboard/DashboardClient';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">My Dashboard</h1>
          <p className="text-lg text-gray-600">
            Track, compare, and manage your apartment search in one place
          </p>
        </div>
        <DashboardClient />
      </div>
    </div>
  );
}