// app/listings/[id]/page.tsx

import ListingView from '@/components/listings/ListingView';

// שים לב: שם התיקייה הדינמית הוא [id] אז הפרמטר הוא params.id
export default function ListingPage({ params }: { params: { id: string } }) {
  
  // הקומפוננטה ListingView תטפל בטעינת המידע ובבדיקות
  return (
    <div className="container mx-auto p-4">
      <ListingView listingId={params.id} />
    </div>
  );
}