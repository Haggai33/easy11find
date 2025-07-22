// /components/dashboard/ChecklistView.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCurrentUser } from '@/hooks/useStore';
import { updatePrivateChecklist, getUserPreferenceProfiles } from '@/lib/seekerService';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { TrackedListing, PrivateChecklist, PreferenceProfile, ContactDetails, ProfileField } from '@/lib/types';
import toast from 'react-hot-toast';
import Link from 'next/link';

// UI Components
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Icons
import { Star, ArrowLeft, Save, CheckCircle2, Phone, MessageSquare, Copy, MapPin, Calendar, Users, FileText, PenSquare } from 'lucide-react';


// --- קומפוננטות עזר קטנות ושימושיות ---
const ContactActions = ({ contact }: { contact?: ContactDetails }) => {
    if (!contact?.phone) return <span className="text-sm text-muted-foreground">לא הוזן מספר</span>;

    const handleCopy = () => {
        navigator.clipboard.writeText(contact.phone!);
        toast.success('המספר הועתק!');
    };
    
    const formattedPhone = contact.phone.startsWith('+') ? contact.phone.replace(/[^0-9+]/g, '') : `+972${contact.phone.replace(/[^0-9]/g, '').substring(1)}`;

    return (
        <div className="flex items-center gap-2 mt-2">
            <a href={`tel:${contact.phone}`} className="flex-1"><Button variant="outline" size="sm" className="w-full"><Phone className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">חייג</span></Button></a>
            <a href={`https://wa.me/${formattedPhone}`} target="_blank" rel="noopener noreferrer" className="flex-1"><Button variant="outline" size="sm" className="w-full"><MessageSquare className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">WhatsApp</span></Button></a>
            <Button variant="outline" size="sm" className="flex-1" onClick={handleCopy}><Copy className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">העתק</span></Button>
        </div>
    );
};

const AddressLink = ({ address }: { address?: string }) => {
    if (!address) return <span>כתובת לא צוינה</span>;
    
    return (
        <a href={`google.com/maps?q=...{encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
            <MapPin className="w-5 h-5" /> {address}
        </a>
    );
};

const StarRating = ({ rating, setRating }: { rating: number, setRating: (r: number) => void }) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        star <= rating ? 'bg-yellow-400 text-white hover:bg-yellow-500' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                    }`}
                >
                    <Star className="w-4 h-4 fill-current" />
                </button>
            ))}
        </div>
    );
};
// --- סוף קומפוננטות עזר ---


export default function ChecklistView({ trackedListingId }: { trackedListingId: string }) {
    const user = useCurrentUser();
    const [trackedListing, setTrackedListing] = useState<TrackedListing | null>(null);
    const [checklist, setChecklist] = useState<PrivateChecklist>({ ratings: {} });
    const [profiles, setProfiles] = useState<Record<string, PreferenceProfile>>({});
    const [selectedProfileId, setSelectedProfileId] = useState<string>('default');
    const [orderedRatingCategories, setOrderedRatingCategories] = useState<Array<ProfileField>>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const baseRatingCategories = useMemo(() => [
        { id: 'location', label: 'מיקום ושכונה', isCustom: false },
        { id: 'condition', label: 'מצב הדירה', isCustom: false },
        { id: 'size', label: 'גודל ומבנה', isCustom: false },
    ], []);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        };
        setLoading(true);
        const trackedListingRef = ref(db, `users/${user.uid}/trackedListings/${trackedListingId}`);
        const unsubscribeListing = onValue(trackedListingRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val() as TrackedListing;
                setTrackedListing(data);
                setChecklist(data.privateChecklist || { ratings: {} });
            }
            setLoading(false);
        });

        const fetchProfiles = async () => {
            const { profiles: fetchedProfiles } = await getUserPreferenceProfiles(user.uid);
            if (fetchedProfiles) {
                setProfiles(fetchedProfiles);
                const profileIds = Object.keys(fetchedProfiles);
                if(profileIds.length > 0) {
                    setSelectedProfileId(profileIds[0]);
                }
            }
        };
        fetchProfiles();
        return () => unsubscribeListing();
    }, [user, trackedListingId]);

    useEffect(() => {
        const selectedProfile = profiles[selectedProfileId];
        if (selectedProfileId !== 'default' && selectedProfile) {
            const profileOrder = selectedProfile.fieldOrder;
            const allFields = selectedProfile.fields || [];
            const ordered = [...allFields].sort((a, b) => {
                const indexA = profileOrder.indexOf(a.id);
                const indexB = profileOrder.indexOf(b.id);
                if (indexA > -1 && indexB > -1) return indexA - indexB;
                if (indexA > -1) return -1;
                if (indexB > -1) return 1;
                return 0;
            });
            setOrderedRatingCategories(ordered);
        } else {
            setOrderedRatingCategories(baseRatingCategories);
        }
    }, [selectedProfileId, profiles, baseRatingCategories]);

    const handleChecklistUpdate = (updatedData: Partial<PrivateChecklist>) => {
        setChecklist(prev => ({...prev, ...updatedData}));
    }

    const handleRatingChange = (categoryId: string, rating: number) => {
        const updatedRatings = { ...checklist.ratings, [categoryId]: { ...checklist.ratings?.[categoryId], rating } };
        handleChecklistUpdate({ ratings: updatedRatings });
    };

    const handleNotesChange = (categoryId: string, notes: string) => {
        const updatedRatings = { ...checklist.ratings, [categoryId]: { ...checklist.ratings?.[categoryId], notes } };
        handleChecklistUpdate({ ratings: updatedRatings });
    };

    const handleSave = async () => {
        if (!user || !trackedListing) return;
        setSaving(true);
        const { success } = await updatePrivateChecklist(user.uid, trackedListingId, checklist);
        setSaving(false);
        if (success) {
            toast.success("הצ'קליסט עודכן!");
        } else {
            toast.error("שמירת הצ'קליסט נכשלה.");
        }
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

    const { manualData, privateChecklist } = trackedListing;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                           <CardTitle className="text-2xl font-bold"><AddressLink address={manualData?.address} /></CardTitle>
                           <p className="text-muted-foreground text-lg">{manualData?.rent ? `₪${manualData.rent.toLocaleString()}` : 'לא צוין מחיר'}</p>
                        </div>
                         <Link href="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader><CardTitle>פרטים ופעולות</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-4">
                         <div>
                            <Label className="font-semibold">איש קשר: {manualData?.tenantContact?.name || ''}</Label>
                            <ContactActions contact={manualData?.tenantContact} />
                        </div>
                         <div>
                            <Label className="font-semibold">בעל הדירה: {manualData?.landlordContact?.name || ''}</Label>
                            <ContactActions contact={manualData?.landlordContact} />
                        </div>
                    </div>
                    <div className="space-y-3 text-sm border-t md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0">
                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /><Label>כניסה:</Label> {privateChecklist?.moveInDate || 'לא הוזן'}</div>
                        <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /><Label>סוג חוזה:</Label> {privateChecklist?.contractType || 'לא הוזן'}</div>
                        <div className="flex items-center gap-2"><PenSquare className="w-4 h-4 text-primary" /><Label>תאריך חוזה חדש:</Label> {privateChecklist?.newContractDate || 'לא הוזן'}</div>
                        <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><Label>שותפים:</Label> {privateChecklist?.roommates || 'לא הוזן'}</div>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            {/* ======================= התיקון נמצא כאן ======================= */}
                            <CardTitle>צ{"'"}קליסט ודירוג</CardTitle>
                            {/* ========================================================== */}
                            <CardDescription>כאן אפשר לדרג את הפרמטרים החשובים לך ולרשום הערות.</CardDescription>
                        </div>
                        <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="בחר פרופיל..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">סדר ברירת מחדל</SelectItem>
                                {Object.values(profiles).map(profile => (
                                    <SelectItem key={profile.id} value={profile.id}>{profile.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {orderedRatingCategories.map((category, index) => {
                        const ratingData = checklist.ratings?.[category.id];
                        const prefilledNote = ratingData?.notes;
                        const hasPrefilledNote = prefilledNote !== undefined && prefilledNote !== '';
                        let displayValue = prefilledNote;
                        if (prefilledNote === 'true') displayValue = 'כן';
                        if (prefilledNote === 'false') displayValue = 'לא';

                        return (
                            <div key={category.id}>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-medium flex items-center gap-2">
                                            {category.label}
                                            {hasPrefilledNote && (
                                                <span title="מידע מולא מראש">
                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                </span>
                                            )}
                                        </Label>
                                        <StarRating
                                            rating={ratingData?.rating || 0}
                                            setRating={(rating) => handleRatingChange(category.id, rating)}
                                        />
                                    </div>
                                    {hasPrefilledNote ? (
                                        <div className="p-3 bg-secondary rounded-md text-sm text-muted-foreground">
                                            <span className="font-semibold text-foreground">מידע מהמודעה:</span> {displayValue}
                                        </div>
                                    ) : (
                                        <Textarea
                                            placeholder={`הערות על ${category.label.toLowerCase()}...`}
                                            value={ratingData?.notes || ''}
                                            onChange={(e) => handleNotesChange(category.id, e.target.value)}
                                            rows={2}
                                            className="resize-none"
                                        />
                                    )}
                                </div>
                                {index < orderedRatingCategories.length - 1 && <Separator className="mt-6" />}
                            </div>
                        );
                    })}
                </CardContent>
             </Card>

             <Card>
                <CardHeader><CardTitle>הערות כלליות</CardTitle></CardHeader>
                <CardContent>
                    <Textarea 
                        placeholder="רשום פה כל דבר שעולה לך לראש - יתרונות, חסרונות, תזכורות..." 
                        rows={5}
                        value={checklist.generalNotes || manualData?.description || ''}
                        onChange={(e) => handleChecklistUpdate({ generalNotes: e.target.value })}
                    />
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} size="lg">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'שומר...' : 'שמור שינויים'}
                </Button>
            </div>
        </div>
    );
}