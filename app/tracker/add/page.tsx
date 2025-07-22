// app/tracker/add/page.tsx

import TrackNewForm from '@/components/dashboard/TrackNewForm';

export default function AddTrackerPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Add External Apartment to Tracker</h1>
      <TrackNewForm />
    </div>
  );
}