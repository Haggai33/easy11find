// /app/(protected)/dashboard/checklist/[trackedListingId]/page.tsx
import ChecklistView from '@/components/dashboard/ChecklistView';

export default function ChecklistPage({ params }: { params: { trackedListingId: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <ChecklistView trackedListingId={params.trackedListingId} />
      </div>
    </div>
  );
}