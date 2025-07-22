// /components/listings/ListingView.tsx
'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useStore';
import { trackInternalListing } from '@/lib/seekerService';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Listing } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Calendar, Mail, Share2, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function ListingView({ listingId }: { listingId: string }) {
  const user = useCurrentUser();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    const listingRef = ref(db, `listings/${listingId}`);
    const unsubscribe = onValue(
      listingRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setListing(snapshot.val());
        } else {
          setError('Listing not found.');
        }
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError('Failed to fetch listing data.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [listingId]);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Apartment Listing',
        text: 'Check out this apartment listing',
        url: window.location.href,
      });
    } catch (err) {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleTrackListing = async () => {
    if (!user) {
      toast.error('Please log in to track this listing.');
      return;
    }
    
    setIsTracking(true);
    const { success, error } = await trackInternalListing(user.uid, listingId);
    setIsTracking(false);
    
    if (success) {
      toast.success('Listing added to your dashboard!');
    } else {
      toast.error('Failed to track listing. It may already be in your dashboard.');
    }
  };

  const renderFieldValue = (field: any) => {
    switch (field.type) {
      case 'boolean':
        return (
          <Badge variant={field.value ? 'default' : 'secondary'}>
            {field.value ? 'Yes' : 'No'}
          </Badge>
        );
      case 'number':
        return (
          <span className="font-semibold text-lg">
            {field.label.includes('ש"ח') || field.label.includes('rent') 
              ? `₪${field.value.toLocaleString()}` 
              : field.value.toLocaleString()}
          </span>
        );
      case 'longtext':
        return (
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {field.value}
          </div>
        );
      default:
        return <span className="text-gray-900">{field.value}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-red-500 text-lg font-semibold mb-2">Error</div>
            <p className="text-gray-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!listing) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-gray-500 text-lg font-semibold mb-2">Not Found</div>
            <p className="text-gray-600">This listing could not be found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedFields = listing.publicData.fields.sort((a, b) => a.order - b.order);
  const addressField = sortedFields.find(field => 
    field.label.includes('כתובת') || field.label.toLowerCase().includes('address')
  );

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-gray-900">
                Apartment Listing
              </CardTitle>
              {addressField && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="text-lg">{addressField.value}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {user && (
                <Button
                  onClick={handleTrackListing}
                  disabled={isTracking}
                  className="flex items-center gap-2"
                >
                  <Bookmark className="w-4 h-4" />
                  {isTracking ? 'Saving...' : 'Save to Dashboard'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 pt-2">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Created {new Date(listing.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-1" />
              Contact: {listing.ownerEmail}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid gap-6">
            {sortedFields.map((field, index) => (
              <div key={field.id}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      {field.label}
                      {field.isCustom && (
                        <Badge variant="outline" className="text-xs">
                          Custom
                        </Badge>
                      )}
                    </h3>
                  </div>
                  <div className="pl-0">
                    {renderFieldValue(field)}
                  </div>
                </div>
                {index < sortedFields.length - 1 && (
                  <Separator className="mt-6" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Contact Information</h4>
            <p className="text-gray-600">
              Interested in this property? Contact the owner at{' '}
              <a 
                href={`mailto:${listing.ownerEmail}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {listing.ownerEmail}
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}