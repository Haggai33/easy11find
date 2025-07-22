// /lib/types.ts

// For the Lister-Side Module
export interface ListingField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'longtext';
  value: string | number | boolean;
  isCustom: boolean;
  order: number;
}

export interface Listing {
  listingId: string;
  ownerEmail: string;
  editToken: string;
  createdAt: string; // ISO String
  publicData: {
    fields: ListingField[];
  };
}

// For the Seeker-Side Module
export interface User {
  uid: string;
  email: string | null;
  createdAt: string; // ISO String
}

export interface PrivateChecklist {
  ratings: {
    [fieldId: string]: {
      rating: number; // 1-5
      notes?: string;
    };
  };
  generalNotes?: string;
  pros?: string;
  cons?: string;
  photos?: {
    [photoId: string]: {
      url: string; // Firebase Storage URL
      createdAt: string; // ISO String
    };
  };
}

export interface TrackedListing {
  listingId: string; // Can be an internal listingId or a custom generated ID
  source: 'internal' | 'external_manual';
  manualData?: {
    address: string;
    rent?: number;
  };
  privateChecklist: PrivateChecklist;
}