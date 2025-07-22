// /components/dashboard/DashboardClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useStore';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { TrackedListing } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, DollarSign, Star, ExternalLink } from 'lucide-react';

export default function DashboardClient() {
  const user = useCurrentUser();
  const [trackedListings, setTrackedListings] = useState<TrackedListing[]>([]);
  const [loading, setLoading] = useState(true);
  console.log("DashboardClient: Rendering. User is:", user, "Loading state is:", loading);


  useEffect(() => {
    if (!user) return;
    const trackedListingsRef = ref(db, `users/${user.uid}/trackedListings`);
    const unsubscribe = onValue(trackedListingsRef, (snapshot) => {
      console.log("DashboardClient: Firebase listener responded. Snapshot exists:", snapshot.exists());

      if (snapshot.exists()) {
        const data = snapshot.val();
        const listingsArray = Object.entries(data).map(([key, value]) => ({
          ...(value as TrackedListing),
          trackingId: key
        }));
        setTrackedListings(listingsArray);
      } else {
        setTrackedListings([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

        


  const getAverageRating = (checklist: any) => {
    const ratings = checklist?.ratings || {};
    const ratingValues = Object.values(ratings).map((r: any) => r.rating).filter(Boolean);
    if (ratingValues.length === 0) return 0;
    return ratingValues.reduce((sum: number, rating: number) => sum + rating, 0) / ratingValues.length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Tracked Apartments</h2>
          <p className="text-gray-600">Manage and compare your apartment options</p>
        </div>
        <Link href="/dashboard/track-new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add External Listing
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tracked</p>
                <p className="text-2xl font-bold text-gray-900">{trackedListings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trackedListings.length > 0 
                    ? (trackedListings.reduce((sum, listing) => sum + getAverageRating(listing.privateChecklist), 0) / trackedListings.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ExternalLink className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">External</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trackedListings.filter(l => l.source === 'external_manual').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listings Grid */}
      {trackedListings.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No apartments tracked yet</h3>
              <p className="text-gray-600 mb-6">Start tracking apartments to compare and manage your search</p>
              <Link href="/dashboard/track-new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Apartment
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trackedListings.map((listing) => {
            const averageRating = getAverageRating(listing.privateChecklist);
            const hasNotes = listing.privateChecklist?.generalNotes || 
                           listing.privateChecklist?.pros || 
                           listing.privateChecklist?.cons;

            return (
              <Card key={listing.listingId} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold line-clamp-2">
                        {listing.source === 'external_manual' 
                          ? listing.manualData?.address 
                          : `Internal Listing`
                        }
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={listing.source === 'internal' ? 'default' : 'secondary'}>
                          {listing.source === 'internal' ? 'Internal' : 'External'}
                        </Badge>
                        {averageRating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {listing.manualData?.rent && (
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 mr-1" />
                        ₪{listing.manualData.rent.toLocaleString()}
                      </div>
                    )}
                    
                    {hasNotes && (
                      <div className="text-sm text-gray-500">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Has personal notes
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Link href={`/dashboard/checklist/${listing.listingId}`} className="flex-1">

                        <Button variant="outline" size="sm" className="w-full">
                          View Checklist
                        </Button>
                      </Link>
                      {listing.source === 'internal' && (
                        <Link href={`/listing/${listing.listingId}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}