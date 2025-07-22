// /components/listings/CreateListingForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListingField } from '@/lib/types';
import { createListing } from '@/lib/listingService';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, GripVertical } from 'lucide-react';

const initialFields: ListingField[] = [
  { id: 'f1', label: 'כתובת', type: 'text', value: '', isCustom: false, order: 1 },
  { id: 'f2', label: 'שכר דירה (ש"ח)', type: 'number', value: '', isCustom: false, order: 2 },
  { id: 'f3', label: 'קומה', type: 'number', value: '', isCustom: false, order: 3 },
  { id: 'f4', label: 'יש מרפסת?', type: 'boolean', value: false, isCustom: false, order: 4 },
];

export default function CreateListingForm() {
  const [fields, setFields] = useState<ListingField[]>(initialFields);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleFieldChange = (id: string, newValue: string | number | boolean) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, value: newValue } : field
      )
    );
  };

  const handleFieldLabelChange = (id: string, newLabel: string) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, label: newLabel } : field
      )
    );
  };

  const handleFieldTypeChange = (id: string, newType: 'text' | 'number' | 'boolean' | 'longtext') => {
    setFields(
      fields.map((field) =>
        field.id === id ? { 
          ...field, 
          type: newType,
          value: newType === 'boolean' ? false : newType === 'number' ? 0 : ''
        } : field
      )
    );
  };

  const addCustomField = () => {
    const newField: ListingField = {
      id: `custom_${Date.now()}`,
      label: 'שדה מותאם אישית',
      type: 'text',
      value: '',
      isCustom: true,
      order: fields.length + 1,
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  const renderFieldInput = (field: ListingField) => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            value={field.value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Enter ${field.label}`}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={field.value as number}
            onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
            placeholder={`Enter ${field.label}`}
          />
        );
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={field.value as boolean}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            />
            <span>{field.value ? 'Yes' : 'No'}</span>
          </div>
        );
      case 'longtext':
        return (
          <Textarea
            value={field.value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Enter ${field.label}`}
            rows={3}
          />
        );
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerEmail) {
      toast.error('Please enter your email address.');
      return;
    }

    // Validate that required fields have values
    const emptyRequiredFields = fields.filter(field => 
      !field.isCustom && (field.value === '' || field.value === null || field.value === undefined)
    );

    if (emptyRequiredFields.length > 0) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    const { listingId, error } = await createListing(ownerEmail, fields);
    setIsSubmitting(false);

    if (error) {
      toast.error('Failed to create listing. Please try again.');
    } else if (listingId) {
      toast.success('Listing created successfully!');
      router.push(`/listing/${listingId}`);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Create Your Apartment Listing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Owner Email */}
            <div className="space-y-2">
              <Label htmlFor="ownerEmail" className="text-base font-medium">
                Your Email Address *
              </Label>
              <Input
                id="ownerEmail"
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                required
                placeholder="your.email@example.com"
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                We'll send you an edit link to manage your listing
              </p>
            </div>

            {/* Dynamic Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Listing Details</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustomField}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Custom Field
                </Button>
              </div>

              {fields
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <Card key={field.id} className="p-4">
                    <div className="space-y-3">
                      {/* Field Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          {field.isCustom ? (
                            <Input
                              value={field.label}
                              onChange={(e) => handleFieldLabelChange(field.id, e.target.value)}
                              className="font-medium"
                              placeholder="Field name"
                            />
                          ) : (
                            <Label className="font-medium">{field.label}</Label>
                          )}
                          {!field.isCustom && <span className="text-red-500">*</span>}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {field.isCustom && (
                            <Select
                              value={field.type}
                              onValueChange={(value: 'text' | 'number' | 'boolean' | 'longtext') =>
                                handleFieldTypeChange(field.id, value)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="boolean">Yes/No</SelectItem>
                                <SelectItem value="longtext">Long Text</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          
                          {field.isCustom && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeField(field.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Field Input */}
                      <div className="w-full">
                        {renderFieldInput(field)}
                      </div>
                    </div>
                  </Card>
                ))}
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 text-lg"
                size="lg"
              >
                {isSubmitting ? 'Creating Listing...' : 'Create Listing'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}