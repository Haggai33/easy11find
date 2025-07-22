// /components/dashboard/ChecklistView.tsx
'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useStore';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { updatePrivateChecklist } from '@/lib/seekerService';
import { TrackedListing, PrivateChecklist } from '@/lib/types';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Star, ArrowLeft, MapPin, DollarSign, Save } from 'lucide-react';
import Link from 'next/link';

export default function ChecklistView({ trackedListingId }: { trackedListingId: string }) {
  const user = useCurrentUser();
  const [trackedListing, setTrackedListing] = useState<TrackedListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checklist, setChecklist] = useState<PrivateChecklist>({
    ratings: {},
    generalNotes: '',
    pros: '',
    cons: '',
  });

  // Predefined rating categories
  const ratingCategories = [
    { id: 'location', label: 'Location & Neighborhood' },
    { id: 'condition', label: 'Apartment Condition' },
    { id: 'size', label: 'Size & Layout' },
    { id: 'price', label: 'Price Value' },
    { id: 'landlord', label: 'Landlord/Agent' },
    { id: 'amenities', label: 'Amenities & Features' },
  ];

  useEffect(() => {
    if (!user) return;
    
    const trackedListingRef = ref(db, `users/${user.uid}/trackedListings/${trackedListingId}`);
    const unsubscribe = onValue(trackedListingRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as TrackedListing;
        setTrackedListing(data);
        setChecklist(data.privateChecklist || { ratings: {} });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, trackedListingId]);

  const handleRatingChange = (categoryId: string, rating: number, notes?: string) => {
    setChecklist(prev => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [categoryId]: { rating, notes: notes || prev.ratings?.[categoryId]?.notes || '' }
      }
    }));
  };

  const handleNotesChange = (categoryId: string, notes: string) => {
    setChecklist(prev => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [categoryId]: { 
          rating: prev.ratings?.[categoryId]?.rating || 0, 
          notes 
        }
      }
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    const { success, error } = await updatePrivateChecklist(user.uid, trackedListingId, checklist);
    setSaving(false);

    if (success) {
      toast.success('Checklist saved successfully!');
    } else {
      toast.error('Failed to save checklist. Please try again.');
      console.error('Error saving checklist:', error);
    }
  };

  const getAverageRating = () => {
    const ratings = Object.values(checklist.ratings || {})
      .map(r => r.rating)
      .filter(r => r > 0);
    
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  };

  const renderStars = (categoryId: string, currentRating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(categoryId, star)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              star <= currentRating
                ? 'bg-yellow-400 text-white hover:bg-yellow-500'
                : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
            }`}
          >
            <Star className="w-4 h-4 fill-current" />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!trackedListing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Apartment not found.</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const averageRating = getAverageRating();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  {trackedListing.source === 'external_manual' 
                    ? trackedListing.manualData?.address 
                    : `Internal Listing ${trackedListing.listingId}`
                  }
                  <Badge variant={trackedListing.source === 'internal' ? 'default' : 'secondary'}>
                    {trackedListing.source === 'internal' ? 'Internal' : 'External'}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-4 mt-2 text-gray-600">
                  {trackedListing.manualData?.rent && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      ₪{trackedListing.manualData.rent.toLocaleString()}
                    </div>
                  )}
                  {averageRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{averageRating.toFixed(1)} average</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Rating Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Rate This Apartment</CardTitle>
          <p className="text-gray-600">Rate different aspects of this apartment from 1-5 stars</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {ratingCategories.map((category, index) => (
            <div key={category.id}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">{category.label}</Label>
                  <div className="flex items-center gap-2">
                    {renderStars(category.id, checklist.ratings?.[category.id]?.rating || 0)}
                    <span className="text-sm text-gray-500 min-w-[60px]">
                      {checklist.ratings?.[category.id]?.rating 
                        ? `${checklist.ratings[category.id].rating}/5`
                        : 'Not rated'
                      }
                    </span>
                  </div>
                </div>
                <Textarea
                  placeholder={`Add notes about ${category.label.toLowerCase()}...`}
                  value={checklist.ratings?.[category.id]?.notes || ''}
                  onChange={(e) => handleNotesChange(category.id, e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
              {index < ratingCategories.length - 1 && <Separator className="mt-6" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* General Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="generalNotes" className="text-base font-medium">General Notes</Label>
            <Textarea
              id="generalNotes"
              placeholder="Add any general thoughts or observations about this apartment..."
              value={checklist.generalNotes || ''}
              onChange={(e) => setChecklist(prev => ({ ...prev, generalNotes: e.target.value }))}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="pros" className="text-base font-medium text-green-700">Pros</Label>
              <Textarea
                id="pros"
                placeholder="What are the positive aspects of this apartment?"
                value={checklist.pros || ''}
                onChange={(e) => setChecklist(prev => ({ ...prev, pros: e.target.value }))}
                rows={4}
                className="resize-none border-green-200 focus:border-green-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cons" className="text-base font-medium text-red-700">Cons</Label>
              <Textarea
                id="cons"
                placeholder="What are the negative aspects or concerns?"
                value={checklist.cons || ''}
                onChange={(e) => setChecklist(prev => ({ ...prev, cons: e.target.value }))}
                rows={4}
                className="resize-none border-red-200 focus:border-red-400"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center pb-8">
        <Button onClick={handleSave} disabled={saving} size="lg" className="px-8">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving Changes...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  );
}