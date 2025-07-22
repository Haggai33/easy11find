// /components/dashboard/TrackNewForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useStore';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Firebase and Service imports
import { ref, push, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getUserPreferenceProfiles } from '@/lib/seekerService';
import { addExternalTrackedListing } from '@/lib/seekerService'; // Assuming this function exists and is updated

// Type imports
import { TrackedListing, PrivateChecklist, PreferenceProfile, ProfileField, ManualData } from '@/lib/types';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Icons
import { ArrowLeft } from 'lucide-react';

export default function TrackNewForm() {
    const user = useCurrentUser();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- State for all form fields, based on our new types ---
    const [manualData, setManualData] = useState<Partial<ManualData>>({
        address: '',
        rent: undefined,
        tenantContact: { name: '', phone: '' },
        landlordContact: { name: '', phone: '' },
        description: ''
    });
    const [checklistData, setChecklistData] = useState<Partial<PrivateChecklist>>({
        moveInDate: '',
        contractType: undefined,
        newContractDate: '',
        roommates: undefined,
        ratings: {}
    });
    const [activeProfile, setActiveProfile] = useState<PreferenceProfile | null>(null);

    // Fetch user's preference profile
    useEffect(() => {
        if (user) {
            getUserPreferenceProfiles(user.uid).then(({ profiles }) => {
                if (profiles && Object.keys(profiles).length > 0) {
                    const firstProfile = Object.values(profiles)[0];
                    setActiveProfile(firstProfile);
                }
            });
        }
    }, [user]);

    const handleManualDataChange = (field: keyof ManualData, value: any) => {
        setManualData(prev => ({ ...prev, [field]: value }));
    };

    const handleContactChange = (contactType: 'tenantContact' | 'landlordContact', field: 'name' | 'phone', value: string) => {
        setManualData(prev => ({
            ...prev,
            [contactType]: {
                ...prev[contactType],
                [field]: value,
            }
        }));
    };

    const handleChecklistChange = (field: keyof PrivateChecklist, value: any) => {
        setChecklistData(prev => ({ ...prev, [field]: value }));
    };

    const handleChecklistValueChange = (fieldId: string, value: string | number | boolean) => {
        setChecklistData(prev => ({
            ...prev,
            ratings: {
                ...prev.ratings,
                [fieldId]: {
                    ...prev.ratings?.[fieldId],
                    notes: String(value)
                }
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error('Please log in to track apartments.');
            return;
        }

        if (!manualData.address?.trim()) {
            toast.error('Please enter an address.');
            return;
        }

        setIsSubmitting(true);

        const fullManualData = {
            ...manualData,
            rent: manualData.rent ? parseFloat(String(manualData.rent)) : undefined,
        };
        
        // This function needs to be created or updated in seekerService.ts
        // to accept both manualData and checklistData.
        const { success, error } = await addExternalTrackedListing(user.uid, fullManualData, checklistData);
        setIsSubmitting(false);

        if (success) {
            toast.success('הדירה נוספה בהצלחה!');
            router.push('/dashboard');
        } else {
            toast.error('אופס, משהו השתבש.');
            console.error('Error adding listing:', error);
        }
    };

    const renderChecklistItem = (field: ProfileField) => {
        const value = checklistData.ratings?.[field.id]?.notes;
        const isToggle = ["מעלית", "סלון", "נפרדים", "מזגן"].some(keyword => field.label.includes(keyword));

        if (isToggle) {
            return (
                <Switch
                    checked={value === 'true'}
                    onCheckedChange={(checked) => handleChecklistValueChange(field.id, checked)}
                />
            );
        }
        
        const isNumber = ["קומה", "מארחים"].some(keyword => field.label.includes(keyword));
        if(isNumber) {
            return (
                 <Input
                    type="number"
                    placeholder="פרטים..."
                    value={value || ''}
                    onChange={(e) => handleChecklistValueChange(field.id, e.target.value)}
                />
            );
        }
        
        return (
            <Input
                placeholder="פרטים..."
                value={value || ''}
                onChange={(e) => handleChecklistValueChange(field.id, e.target.value)}
            />
        );
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Link href="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
                    <div>
                        <CardTitle className="text-2xl font-bold">הוספת דירה למעקב</CardTitle>
                        <CardDescription className="mt-1">מלא את כל הפרטים שאתה יודע מהמודעה.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    {/* General Details */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="address">כתובת מלאה *</Label>
                            <Input id="address" value={manualData.address} onChange={(e) => handleManualDataChange('address', e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rent">שכ&quotד</Label>
                            <Input id="rent" type="number" value={manualData.rent || ''} onChange={(e) => handleManualDataChange('rent', e.target.value)} />
                        </div>
                    </div>

                    <Separator />

                    {/* Contact Details */}
                    <h3 className="text-lg font-semibold">פרטי קשר</h3>
                    <div className="p-4 border rounded-lg space-y-4 bg-secondary/50">
                        <Label>איש קשר (דייר נוכחי / מתווך)</Label>
                        <div className="grid grid-cols-2 gap-4">
                             <Input placeholder="שם" value={manualData.tenantContact?.name} onChange={e => handleContactChange('tenantContact', 'name', e.target.value)} />
                             <Input type="tel" placeholder="טלפון" value={manualData.tenantContact?.phone} onChange={e => handleContactChange('tenantContact', 'phone', e.target.value)} />
                        </div>
                         <Label>בעל הדירה (אופציונלי, אפשר למלא אח&quotכ)</Label>
                         <div className="grid grid-cols-2 gap-4">
                             <Input placeholder="שם" value={manualData.landlordContact?.name} onChange={e => handleContactChange('landlordContact', 'name', e.target.value)} />
                             <Input type="tel" placeholder="טלפון" value={manualData.landlordContact?.phone} onChange={e => handleContactChange('landlordContact', 'phone', e.target.value)} />
                        </div>
                    </div>

                    <Separator />

                    {/* Contract & Apartment Details */}
                    <h3 className="text-lg font-semibold">פרטי חוזה ודירה</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="moveInDate">תאריך כניסה</Label>
                            <Input id="moveInDate" type="date" value={checklistData.moveInDate} onChange={(e) => handleChecklistChange('moveInDate', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newContractDate">תאריך חוזה חדש</Label>
                            <Input id="newContractDate" type="date" value={checklistData.newContractDate} onChange={(e) => handleChecklistChange('newContractDate', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contractType">סוג חוזה</Label>
                            <Select onValueChange={(value) => handleChecklistChange('contractType', value)} >
                                <SelectTrigger><SelectValue placeholder="בחר סוג..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="12-months">12 חודשים</SelectItem>
                                    <SelectItem value="sublet">סאבלט</SelectItem>
                                    <SelectItem value="other">אחר</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="roommates">מספר שותפים (כולל אותך)</Label>
                            <Input id="roommates" type="number" min="1" value={checklistData.roommates || ''} onChange={(e) => handleChecklistChange('roommates', e.target.value ? parseInt(e.target.value) : undefined)} />
                        </div>
                    </div>

                    <Separator />
                    
                    {/* Pre-fill Checklist Section */}
                    {activeProfile ? (
                        <div className="space-y-4">
                                <h3 className="text-lg font-semibold">פרטים מהמודעה (לפי הפרופIL)</h3>
                                {activeProfile.fieldOrder.map(fieldId => {
                                    const field = activeProfile.fields.find(f => f.id === fieldId);
                                    if (!field) return null;
                                    return (
                                        <div key={fieldId} className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                            <Label htmlFor={fieldId} className="font-medium">{field.label}</Label>
                                            <div className="w-1/3">
                                                {renderChecklistItem(field)}
                                            </div>
                                        </div>
                                    )
                                })}
                        </div>
                    ) : (
                            <div className="text-center text-muted-foreground">טוען פרופיל אישי...</div>
                    )}

                    <Separator />
                    
                    {/* Additional Notes Section */}
                    <div className="space-y-2">
                        <Label htmlFor="description">הערות כלליות</Label>
                        <Textarea id="description" value={manualData.description} onChange={e => handleManualDataChange('description', e.target.value)} placeholder="לינק למודעה, דברים שחשוב לזכור..." />
                    </div>
                    
                    {/* Submit Button */}
                    <div className="pt-4">
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? 'מוסיף...' : 'הוסף דירה למעקב'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}