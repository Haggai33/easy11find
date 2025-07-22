// lib/types.ts

// סוג נתונים חדש לפרטי קשר, כדי לשמור על הסדר
export interface ContactDetails {
    phone?: string;
    name?: string;
}

// עדכון המבנה של ManualData
export interface ManualData {
    address: string;
    rent?: number;
    description?: string;
    tenantContact?: ContactDetails;
    landlordContact?: ContactDetails;
}

// עדכון המבנה של PrivateChecklist
export interface PrivateChecklist {
    ratings: {
        [fieldId: string]: {
            rating: number;
            notes?: string;
        };
    };
    generalNotes?: string;
    pros?: string;
    cons?: string;
    moveInDate?: string; // תאריך כ-string בפורמט YYYY-MM-DD
    contractType?: 'sublet' | '12-months' | 'other';
    newContractDate?: string; // תאריך חוזה חדש
    roommates?: number;
}

// --- שאר סוגי הנתונים בפרויקט נשארים ללא שינוי ---

export interface ProfileField {
  id: string;
  label: string;
  isCustom: boolean;
}

export interface PreferenceProfile {
  id:string;
  name: string;
  fields: ProfileField[];
  fieldOrder: string[];
  requiredFields: string[];
}

export interface TrackedListing {
    listingId: string;
    trackingId?: string;
    source: 'internal' | 'external_manual';
    manualData?: ManualData;
    privateChecklist: PrivateChecklist;
}

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

export interface User {
  uid: string;
  email: string | null;
  createdAt: string; // ISO String
}