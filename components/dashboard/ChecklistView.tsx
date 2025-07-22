// /components/dashboard/ChecklistView.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCurrentUser } from '@/hooks/useStore';
// עדכון ייבוא - הוספנו את getUserPreferenceProfiles
import { updatePrivateChecklist, getUserPreferenceProfiles } from '@/lib/seekerService';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
// עדכון ייבוא - הוספנו את PreferenceProfile
import { TrackedListing, PrivateChecklist, PreferenceProfile } from '@/lib/types';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
// עדכון ייבוא - הוספנו את רכיבי ה-Select
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Icons
import { Star, ArrowLeft, DollarSign, Save } from 'lucide-react';

// קומפוננטה פנימית קטנה לכוכבי דירוג
const StarRating = ({ rating, setRating }: { rating: number, setRating: (r: number) => void }) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        star <= rating
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


export default function ChecklistView({ trackedListingId }: { trackedListingId: string }) {
    const user = useCurrentUser();
    const [trackedListing, setTrackedListing] = useState<TrackedListing | null>(null);
    const [checklist, setChecklist] = useState<PrivateChecklist>({ ratings: {} });

    // --- מצב חדש עבור פרופילים וסידור ---
    const [profiles, setProfiles] = useState<Record<string, PreferenceProfile>>({});
    const [selectedProfileId, setSelectedProfileId] = useState<string>('default');
    const [orderedRatingCategories, setOrderedRatingCategories] = useState<Array<{ id: string, label: string }>>([]);
    // ------------------------------------

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // קטגוריות דירוג בסיסיות - זהו "מקור האמת" שלנו
    const baseRatingCategories = useMemo(() => [
        { id: 'location', label: 'Location & Neighborhood' },
        { id: 'condition', label: 'Apartment Condition' },
        { id: 'size', label: 'Size & Layout' },
        { id: 'price', label: 'Price Value' },
        { id: 'landlord', label: 'Landlord/Agent' },
        { id: 'amenities', label: 'Amenities & Features' },
    ], []);

    // אפקט ראשי לטעינת נתוני הדירה והפרופילים
    useEffect(() => {
        if (!user) return;

        setLoading(true);
        // טעינת מידע על הדירה
        const trackedListingRef = ref(db, `users/${user.uid}/trackedListings/${trackedListingId}`);
        const unsubscribeListing = onValue(trackedListingRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val() as TrackedListing;
                setTrackedListing(data);
                setChecklist(data.privateChecklist || { ratings: {} });
            }
            setLoading(false); // נסמן שהטעינה הסתיימה רק אחרי קבלת נתונים
        });

        // טעינת פרופילי ההעדפות
        const fetchProfiles = async () => {
            const { profiles: fetchedProfiles } = await getUserPreferenceProfiles(user.uid);
            if (fetchedProfiles) {
                setProfiles(fetchedProfiles);
            }
        };

        fetchProfiles();

        // ניקוי המאזין בעת עזיבת הקומפוננטה
        return () => unsubscribeListing();
    }, [user, trackedListingId]);

    // אפקט לעדכון סדר הקטגוריות כאשר המשתמש בוחר פרופיל
    useEffect(() => {
        const selectedProfile = profiles[selectedProfileId];
        if (selectedProfileId !== 'default' && selectedProfile) {
            // סידור הקטגוריות לפי הפרופיל
            const profileOrder = selectedProfile.fieldOrder;
            const ordered = baseRatingCategories
                .slice() // יצירת עותק כדי לא לשנות את המקור
                .sort((a, b) => {
                    const indexA = profileOrder.indexOf(a.id);
                    const indexB = profileOrder.indexOf(b.id);
                    // אם שניהם בפרופיל, סדר לפיו
                    if (indexA > -1 && indexB > -1) return indexA - indexB;
                    // אם רק A בפרופיל, הוא ראשון
                    if (indexA > -1) return -1;
                    // אם רק B בפרופיל, הוא ראשון
                    if (indexB > -1) return 1;
                    // אם שניהם לא בפרופיל, שמור על סדר יציב
                    return 0;
                });
            setOrderedRatingCategories(ordered);
        } else {
            // חזרה לסדר ברירת המחדל
            setOrderedRatingCategories(baseRatingCategories);
        }
    }, [selectedProfileId, profiles, baseRatingCategories]);

    const handleChecklistChange = (field: keyof PrivateChecklist, value: any) => {
        setChecklist(prev => ({ ...prev, [field]: value }));
    };

    const handleRatingChange = (categoryId: string, rating: number) => {
        const currentRatingData = checklist.ratings?.[categoryId] || {};
        const updatedRatings = {
            ...checklist.ratings,
            [categoryId]: { ...currentRatingData, rating }
        };
        handleChecklistChange('ratings', updatedRatings);
    };

    const handleNotesChange = (categoryId: string, notes: string) => {
        const currentRatingData = checklist.ratings?.[categoryId] || { rating: 0 };
        const updatedRatings = {
            ...checklist.ratings,
            [categoryId]: { ...currentRatingData, notes }
        };
        handleChecklistChange('ratings', updatedRatings);
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
        const ratings = Object.values(checklist.ratings || {}).map(r => r.rating).filter(r => r > 0);
        if (ratings.length === 0) return 0;
        return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
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
                <CardContent className="pt-6 text-center">
                    <p className="text-gray-600 mb-4">Apartment not found.</p>
                    <Link href="/dashboard"><Button>Back to Dashboard</Button></Link>
                </CardContent>
            </Card>
        );
    }

    const averageRating = getAverageRating();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
                            <div>
                                <CardTitle className="text-2xl font-bold">{trackedListing.manualData?.address || `Listing`}</CardTitle>
                                <div className="flex items-center gap-4 mt-2 text-gray-600">
                                    {trackedListing.manualData?.rent && (
                                        <div className="flex items-center gap-1"><DollarSign className="w-4 h-4" />₪{trackedListing.manualData.rent.toLocaleString()}</div>
                                    )}
                                    {averageRating > 0 && (
                                        <div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500 fill-current" /><span className="font-medium">{averageRating.toFixed(1)} average</span></div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save Changes'}</Button>
                    </div>
                    {/* --- רכיב בחירת פרופיל --- */}
                    <div className="pt-6">
                        <Label htmlFor="profile-select" className="text-sm font-medium">Preference Profile</Label>
                        <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                            <SelectTrigger id="profile-select" className="w-full sm:w-[280px] mt-2">
                                <SelectValue placeholder="Select a profile..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Default Order</SelectItem>
                                {Object.values(profiles).map(profile => (
                                    <SelectItem key={profile.id} value={profile.id}>{profile.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* --------------------------- */}
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Rate This Apartment</CardTitle>
                    <p className="text-gray-600">Rate different aspects of this apartment from 1-5 stars</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* --- לולאה על הקטגוריות המסודרות --- */}
                    {orderedRatingCategories.map((category, index) => (
                        <div key={category.id}>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-medium">{category.label}</Label>
                                    <div className="flex items-center gap-2">
                                        <StarRating
                                            rating={checklist.ratings?.[category.id]?.rating || 0}
                                            setRating={(rating) => handleRatingChange(category.id, rating)}
                                        />
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
                            {index < orderedRatingCategories.length - 1 && <Separator className="mt-6" />}
                        </div>
                    ))}
                    {/* ------------------------------------- */}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Additional Notes</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label htmlFor="generalNotes" className="text-base font-medium">General Notes</Label>
                        <Textarea id="generalNotes" placeholder="General thoughts or observations..." value={checklist.generalNotes || ''} onChange={(e) => handleChecklistChange('generalNotes', e.target.value)} rows={4} className="resize-none mt-2" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="pros" className="text-base font-medium text-green-700">Pros</Label>
                            <Textarea id="pros" placeholder="Positive aspects..." value={checklist.pros || ''} onChange={(e) => handleChecklistChange('pros', e.target.value)} rows={4} className="resize-none mt-2 border-green-200 focus:border-green-400" />
                        </div>
                        <div>
                            <Label htmlFor="cons" className="text-base font-medium text-red-700">Cons</Label>
                            <Textarea id="cons" placeholder="Negative aspects or concerns..." value={checklist.cons || ''} onChange={(e) => handleChecklistChange('cons', e.target.value)} rows={4} className="resize-none mt-2 border-red-200 focus:border-red-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-center pb-8">
                <Button onClick={handleSave} disabled={saving} size="lg"><Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save All Changes'}</Button>
            </div>
        </div>
    );
}