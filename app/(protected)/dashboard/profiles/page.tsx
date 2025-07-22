// /app/(protected)/dashboard/profiles/page.tsx
import PreferenceManager from '@/components/dashboard/PreferenceManager';

export default function ProfilesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <PreferenceManager />
      </div>
    </div>
  );
}