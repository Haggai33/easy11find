// app/listings/create/page.tsx

import CreateListingForm from '@/components/listings/CreateListingForm';

export default function CreateListingPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Create a New Apartment Listing</h1>
      <CreateListingForm />
    </div>
  );
}