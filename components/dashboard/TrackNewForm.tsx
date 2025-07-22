// /components/dashboard/TrackNewForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useStore';
import { addExternalTrackedListing } from '@/lib/seekerService';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, DollarSign, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TrackNewForm() {
  const user = useCurrentUser();
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [rent, setRent] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to track apartments.');
      return;
    }

    if (!address.trim()) {
      toast.error('Please enter an address.');
      return;
    }

    setIsSubmitting(true);
    
    const manualData = {
      address: address.trim(),
      rent: rent ? parseFloat(rent) : undefined,
      description: description.trim() || undefined,
    };

    const { success, error } = await addExternalTrackedListing(user.uid, manualData);
    setIsSubmitting(false);

    if (success) {
      toast.success('Apartment added to your dashboard!');
      router.push('/dashboard');
    } else {
      toast.error('Failed to add apartment. Please try again.');
      console.error('Error adding external listing:', error);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Please log in to track apartments.</p>
            <Link href="/login">
              <Button>Log In</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <CardTitle className="text-2xl font-bold">Add External Apartment</CardTitle>
            <p className="text-gray-600 mt-1">
              Add an apartment from another website or source to your tracking list
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Address Field */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-base font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address *
            </Label>
            <Input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="Enter the apartment address"
              className="w-full"
              disabled={isSubmitting}
            />
            <p className="text-sm text-gray-500">
              Include street address, city, and any relevant details
            </p>
          </div>

          {/* Rent Field */}
          <div className="space-y-2">
            <Label htmlFor="rent" className="text-base font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Monthly Rent (Optional)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₪</span>
              <Input
                id="rent"
                type="number"
                value={rent}
                onChange={(e) => setRent(e.target.value)}
                placeholder="5000"
                className="pl-8"
                disabled={isSubmitting}
                min="0"
                step="100"
              />
            </div>
            <p className="text-sm text-gray-500">
              Enter the monthly rent amount in Israeli Shekels
            </p>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional details about this apartment..."
              rows={4}
              disabled={isSubmitting}
              className="resize-none"
            />
            <p className="text-sm text-gray-500">
              Include any extra information like contact details, special features, etc.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Link href="/dashboard" className="flex-1">
              <Button type="button" variant="outline" className="w-full" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting || !address.trim()}
              className="flex-1"
            >
              {isSubmitting ? 'Adding...' : 'Add to Dashboard'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}