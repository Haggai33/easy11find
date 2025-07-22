// /app/(protected)/dashboard/track-new/page.tsx
import TrackNewForm from '@/components/dashboard/TrackNewForm';

export default function TrackNewPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Add External Apartment
            </h1>
            <p className="text-lg text-gray-600">
              Track apartments from other sources by adding them manually to your dashboard
            </p>
          </div>
          <TrackNewForm />
        </div>
      </div>
    </div>
  );
}