// /lib/listingService.ts
import { db } from './firebase';
import { ref, set, push } from 'firebase/database';
import { Listing, ListingField } from './types';

export const createListing = async (
  ownerEmail: string,
  fields: ListingField[]
): Promise<{ listingId: string | null; error: Error | null }> => {
  try {
    const listingsRef = ref(db, 'listings');
    const newListingRef = push(listingsRef); // Generates a unique ID
    const newListingId = newListingRef.key;

    if (!newListingId) {
      throw new Error('Failed to create a new listing ID.');
    }

    // In a real app, the token should be more secure, e.g., a JWT or a long random string
    const editToken = Math.random().toString(36).substr(2);

    const newListing: Listing = {
      listingId: newListingId,
      ownerEmail,
      editToken,
      createdAt: new Date().toISOString(),
      publicData: {
        fields: fields,
      },
    };

    await set(newListingRef, newListing);

    // TODO: In a later phase, we would trigger a cloud function here to send an email
    // with the edit link: `/edit/${newListingId}?token=${editToken}`

    return { listingId: newListingId, error: null };
  } catch (e) {
    console.error("Error creating listing:", e);
    return { listingId: null, error: e as Error };
  }
};