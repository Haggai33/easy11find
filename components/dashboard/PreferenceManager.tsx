// /components/dashboard/PreferenceManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useStore';
import { getUserPreferenceProfiles, savePreferenceProfile, updatePreferenceProfile, deletePreferenceProfile } from '@/lib/seekerService';
import { PreferenceProfile, ProfileField } from '@/lib/types';
import toast from 'react-hot-toast';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';

// Import UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Import Icons
import { Plus, Trash2, Edit, Save, ArrowLeft, GripVertical } from 'lucide-react';

const defaultFields: ProfileField[] = [
    { id: 'location', label: 'מיקום ושכונה', isCustom: false },
    { id: 'condition', label: 'מצב הדירה', isCustom: false },
    { id: 'size', label: 'גודל ומבנה', isCustom: false },
    { id: 'price', label: 'מחיר ותמורה', isCustom: false },
    { id: 'landlord', label: 'בעל הדירה', isCustom: false },
    { id: 'amenities', label: 'פינוקים ותוספות', isCustom: false },
];

// ------------------- קומפוננטה פנימית לפריט שניתן לגרירה -------------------
function DraggableFieldItem({ profile, field, onToggleRequired, onDeleteCustom }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isChecked = profile.requiredFields.includes(field.id);
    const isDisabled = !isChecked && profile.requiredFields.length >= 3;

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-3 bg-secondary rounded-lg mb-2">
            <div {...attributes} {...listeners} className="cursor-grab p-1 touch-none">
                <GripVertical className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-grow">
                <p className="font-medium">{field.label}</p>
            </div>
            <div onPointerDown={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                    <Checkbox
                        id={`required-${field.id}`}
                        checked={isChecked}
                        onCheckedChange={() => onToggleRequired(field.id)}
                        disabled={isDisabled}
                    />
                    <Label htmlFor={`required-${field.id}`} className={isDisabled ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}>
                        שדה חובה
                    </Label>
                </div>
                {field.isCustom && (
                    <Button variant="ghost" size="icon" onClick={() => onDeleteCustom(field.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

// ------------------- הקומפוננטה הראשית -------------------
export default function PreferenceManager() {
    const user = useCurrentUser();
    const [profiles, setProfiles] = useState<Record<string, PreferenceProfile>>({});
    const [newCustomFieldName, setNewCustomFieldName] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );
    
    useEffect(() => {
        if (user) {
            getUserPreferenceProfiles(user.uid).then(({ profiles: fetchedProfiles }) => {
                if (fetchedProfiles) {
                    const updatedProfiles = Object.fromEntries(
                        Object.entries(fetchedProfiles).map(([id, profile]) => [
                            id,
                            {
                                ...profile,
                                fields: profile.fields || defaultFields,
                                requiredFields: profile.requiredFields || [],
                                fieldOrder: profile.fieldOrder || defaultFields.map(f => f.id)
                            },
                        ])
                    );
                    setProfiles(updatedProfiles);
                }
            });
        }
    }, [user]);

    const handleUpdateProfile = async (profileId: string) => {
        if (!user) return;
        const profileToUpdate = profiles[profileId];
        await updatePreferenceProfile(user.uid, profileId, profileToUpdate);
        toast.success('הפרופיל עודכן בהצלחה!');
    };

    const handleAddCustomField = (profileId: string) => {
        if (!newCustomFieldName.trim()) return;
        const newField: ProfileField = {
            id: `custom-${Date.now()}`,
            label: newCustomFieldName,
            isCustom: true,
        };
        
        setProfiles(prev => ({
            ...prev,
            [profileId]: {
                ...prev[profileId],
                fields: [...prev[profileId].fields, newField],
                fieldOrder: [...prev[profileId].fieldOrder, newField.id],
            },
        }));
        setNewCustomFieldName('');
    };
    
    const handleDeleteCustomField = (profileId: string, fieldIdToDelete: string) => {
        setProfiles(prev => ({
            ...prev,
            [profileId]: {
                ...prev[profileId],
                fields: prev[profileId].fields.filter(f => f.id !== fieldIdToDelete),
                fieldOrder: prev[profileId].fieldOrder.filter(id => id !== fieldIdToDelete),
                requiredFields: prev[profileId].requiredFields.filter(id => id !== fieldIdToDelete),
            },
        }));
    };

    // ======================= התיקון הסופי והמחייב נמצא כאן =======================
    const handleToggleRequired = (profileId: string, fieldId: string) => {
        setProfiles(prev => {
            const currentProfile = prev[profileId];
            const required = currentProfile.requiredFields;
            const isAlreadyRequired = required.includes(fieldId);
            let newRequiredFields;

            if (isAlreadyRequired) {
                newRequiredFields = required.filter(id => id !== fieldId);
            } else if (required.length < 3) {
                newRequiredFields = [...required, fieldId];
            } else {
                toast.error('אפשר לסמן עד 3 שדות חובה בלבד');
                return prev; 
            }

            return {
                ...prev,
                [profileId]: {
                    ...currentProfile,
                    requiredFields: newRequiredFields,
                },
            };
        });
    };
    // =====================================================================
    
    const handleDragEnd = (event, profileId) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setProfiles(prev => {
                const profile = prev[profileId];
                const oldIndex = profile.fieldOrder.indexOf(active.id as string);
                const newIndex = profile.fieldOrder.indexOf(over.id as string);
                
                return {
                    ...prev,
                    [profileId]: {
                        ...profile,
                        fieldOrder: arrayMove(profile.fieldOrder, oldIndex, newIndex),
                    },
                };
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <CardTitle>ניהול פרופילי העדפות</CardTitle>
                        <CardDescription>סדר, הוסף וסמן מה חשוב לך בכל פרופיל</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    {Object.keys(profiles).length === 0 && (
                        <p className="text-center text-muted-foreground py-8">טוען פרופילים...</p>
                    )}
                    {Object.values(profiles).map(profile => (
                        <Card key={profile.id} className="p-4 border-2 border-primary/20">
                            <div className="flex justify-between items-center mb-4">
                               <h3 className="text-xl font-bold text-primary">{profile.name}</h3>
                               <Button onClick={() => handleUpdateProfile(profile.id)}>
                                    <Save className="w-4 h-4 mr-2" />
                                    שמור שינויים בפרופיל
                                </Button>
                            </div>

                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, profile.id)}>
                                <SortableContext items={profile.fieldOrder} strategy={verticalListSortingStrategy}>
                                    {profile.fieldOrder.map(fieldId => {
                                        const field = profile.fields.find(f => f.id === fieldId);
                                        if (!field) return null;
                                        return (
                                            <DraggableFieldItem
                                                key={field.id}
                                                profile={profile}
                                                field={field}
                                                onToggleRequired={(fid) => handleToggleRequired(profile.id, fid)}
                                                onDeleteCustom={(fid) => handleDeleteCustomField(profile.id, fid)}
                                            />
                                        );
                                    })}
                                </SortableContext>
                            </DndContext>

                            <div className="mt-6 pt-4 border-t">
                                <Label htmlFor="new-custom-field" className="font-semibold">הוספת פרמטר אישי</Label>
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        id="new-custom-field"
                                        value={newCustomFieldName}
                                        onChange={(e) => setNewCustomFieldName(e.target.value)}
                                        placeholder='לדוגמה: "רעש מהשכנים", "מרחק מהעבודה"'
                                    />
                                    <Button onClick={() => handleAddCustomField(profile.id)} variant="secondary">
                                        <Plus className="w-4 h-4 mr-2" /> הוסף
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}