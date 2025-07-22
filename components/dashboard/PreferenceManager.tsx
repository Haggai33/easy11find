// /components/dashboard/PreferenceManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useStore';
import { getUserPreferenceProfiles, savePreferenceProfile, updatePreferenceProfile, deletePreferenceProfile } from '@/lib/seekerService';
import { PreferenceProfile } from '@/lib/types';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit, Save } from 'lucide-react';

const defaultFields = [
    { id: 'location', label: 'Location & Neighborhood' },
    { id: 'condition', label: 'Apartment Condition' },
    { id: 'size', label: 'Size & Layout' },
    { id: 'price', label: 'Price Value' },
    { id: 'landlord', label: 'Landlord/Agent' },
    { id: 'amenities', label: 'Amenities & Features' },
];


export default function PreferenceManager() {
    const user = useCurrentUser();
    const [profiles, setProfiles] = useState<Record<string, PreferenceProfile>>({});
    const [newProfileName, setNewProfileName] = useState('');
    const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            getUserPreferenceProfiles(user.uid).then(({ profiles }) => {
                if (profiles) setProfiles(profiles);
            });
        }
    }, [user]);

    const handleCreateProfile = async () => {
        if (!user || !newProfileName.trim()) return;
        const newProfileData = {
            name: newProfileName,
            fieldOrder: defaultFields.map(f => f.id),
        };
        const { success, profile } = await savePreferenceProfile(user.uid, newProfileData);
        if (success && profile) {
            setProfiles(prev => ({ ...prev, [profile.id]: profile }));
            setNewProfileName('');
            toast.success('Profile created!');
        } else {
            toast.error('Failed to create profile.');
        }
    };

    const handleUpdateProfile = async (profileId: string) => {
        if (!user) return;
        const profile = profiles[profileId];
        const { success } = await updatePreferenceProfile(user.uid, profileId, { name: profile.name, fieldOrder: profile.fieldOrder });
        if (success) {
            toast.success('Profile updated!');
            setEditingProfileId(null);
        } else {
            toast.error('Failed to update profile.');
        }
    };

    const handleDeleteProfile = async (profileId: string) => {
        if (!user || !window.confirm('Are you sure you want to delete this profile?')) return;
        const { success } = await deletePreferenceProfile(user.uid, profileId);
        if (success) {
            const newProfiles = { ...profiles };
            delete newProfiles[profileId];
            setProfiles(newProfiles);
            toast.success('Profile deleted.');
        } else {
            toast.error('Failed to delete profile.');
        }
    };

    const handleFieldOrderChange = (profileId: string, sourceIndex: number, destIndex: number) => {
        const profile = profiles[profileId];
        const newOrder = Array.from(profile.fieldOrder);
        const [removed] = newOrder.splice(sourceIndex, 1);
        newOrder.splice(destIndex, 0, removed);
        setProfiles(prev => ({
            ...prev,
            [profileId]: { ...profile, fieldOrder: newOrder }
        }));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Preference Profiles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-2">
                    <Input
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                        placeholder="New profile name (e.g., 'For me & my partner')"
                    />
                    <Button onClick={handleCreateProfile}><Plus className="w-4 h-4 mr-2" /> Add</Button>
                </div>

                <div className="space-y-4">
                    {Object.values(profiles).map(profile => (
                        <Card key={profile.id} className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                {editingProfileId === profile.id ? (
                                    <Input
                                        value={profile.name}
                                        onChange={(e) => setProfiles(p => ({ ...p, [profile.id]: { ...profile, name: e.target.value } }))}
                                    />
                                ) : (
                                    <h3 className="font-semibold">{profile.name}</h3>
                                )}
                                <div className="flex gap-2">
                                    {editingProfileId === profile.id ? (
                                        <Button size="sm" onClick={() => handleUpdateProfile(profile.id)}><Save className="w-4 h-4 mr-2" /> Save</Button>
                                    ) : (
                                        <Button size="sm" variant="ghost" onClick={() => setEditingProfileId(profile.id)}><Edit className="w-4 h-4" /></Button>
                                    )}
                                    <Button size="sm" variant="destructive" onClick={() => handleDeleteProfile(profile.id)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            </div>
                            {/* Drag and drop functionality would be implemented here */}
                            <p className="text-sm text-muted-foreground mb-2">Parameter Order (Drag & Drop to reorder):</p>
                            <ul className="space-y-2">
                                {profile.fieldOrder.map((fieldId, index) => {
                                    const field = defaultFields.find(f => f.id === fieldId);
                                    return (
                                        <li key={fieldId} className="flex items-center p-2 bg-secondary rounded">
                                            {index + 1}. {field?.label}
                                        </li>
                                    )
                                })}
                            </ul>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}