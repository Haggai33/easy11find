// /app/listing/[listingId]/page.tsx
import ListingView from '@/components/listings/ListingView';

export default function ListingPage({ params }: { params: { listingId: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <ListingView listingId={params.listingId} />
      </div>
    </div>
  );
}