// /lib/seekerService.ts
import { db } from './firebase';
import { ref, set, get, push, update } from 'firebase/database';
import { TrackedListing, PrivateChecklist } from './types';

// Function to add an existing listing to a user's tracking list
export const trackInternalListing = async (userId: string, listingId: string) => {
  try {
    const trackedRef = ref(db, `users/${userId}/trackedListings/${listingId}`);
    const newTrackedItem: Partial<TrackedListing> = {
      listingId: listingId,
      source: 'internal',
      privateChecklist: { ratings: {} }, // Initialize with empty checklist
    };
    await set(trackedRef, newTrackedItem);
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: e as Error };
  }
};

// Function to add a manually entered external listing
export const addExternalTrackedListing = async (userId: string, manualData: { address: string; rent?: number }) => {
  try {
    const trackedListRef = ref(db, `users/${userId}/trackedListings`);
    const newTrackedRef = push(trackedListRef);
    const newId = newTrackedRef.key;
    if (!newId) throw new Error("Failed to generate ID");

    const newTrackedItem: TrackedListing = {
      listingId: newId,
      source: 'external_manual',
      manualData,
      privateChecklist: { ratings: {} },
    };
    await set(newTrackedRef, newTrackedItem);
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: e as Error };
  }
};

// Function to update a user's private checklist for a tracked listing
export const updatePrivateChecklist = async (userId: string, trackedListingId: string, checklistData: PrivateChecklist) => {
  try {
    const checklistRef = ref(db, `users/${userId}/trackedListings/${trackedListingId}/privateChecklist`);
    await update(checklistRef, checklistData);
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: e as Error };
  }
};

// Function to get tracked listings for a user
export const getUserTrackedListings = async (userId: string) => {
  try {
    const trackedListingsRef = ref(db, `users/${userId}/trackedListings`);
    const snapshot = await get(trackedListingsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return { listings: Object.values(data) as TrackedListing[], error: null };
    }
    return { listings: [], error: null };
  } catch (e) {
    return { listings: [], error: e as Error };
  }
};