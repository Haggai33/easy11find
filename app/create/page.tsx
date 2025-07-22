// /app/create/page.tsx
import CreateListingForm from '@/components/listings/CreateListingForm';

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create Your Apartment Listing
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create a detailed, customizable listing for your apartment. 
            Add custom fields to highlight what makes your property special.
          </p>
        </div>
        <CreateListingForm />
      </div>
    </div>
  );
}