"use client";

import { useState } from "react";
import { Artist } from "@/lib/types";
import { updateArtist } from "@/lib/services/artist-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface AvailabilitySettingsProps {
  artist: Artist;
  onUpdate?: (artist: Artist) => void;
}

/**
 * AvailabilitySettings - Configure artist availability preferences
 *
 * Features:
 * - Toggle publish availability to public profile
 * - Select availability mode (selected dates only vs free Fri/Sat/Sun)
 * - Set contact phone/WhatsApp numbers
 * - Choose preferred contact method
 * - Save settings to API
 */
export default function AvailabilitySettings({ artist, onUpdate }: AvailabilitySettingsProps) {
  const [publishAvailability, setPublishAvailability] = useState(artist.publishAvailability || false);
  const [availabilityMode, setAvailabilityMode] = useState<'selected_dates_only' | 'free_weekends'>(
    artist.availabilityMode || 'selected_dates_only'
  );
  const [contactMethod, setContactMethod] = useState<'phone' | 'whatsapp'>(
    artist.contactMethod || 'phone'
  );
  const [phoneNumber, setPhoneNumber] = useState(artist.phoneNumber || '');
  const [whatsappNumber, setWhatsappNumber] = useState(artist.whatsappNumber || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updates: Partial<Artist> = {
        publishAvailability,
        availabilityMode,
        contactMethod,
        phoneNumber: phoneNumber.trim() || null,
        whatsappNumber: whatsappNumber.trim() || null,
      };

      const updatedArtist = await updateArtist(artist.id, updates);
      setSuccess(true);
      if (onUpdate) {
        onUpdate(updatedArtist);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Availability Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage how your availability is displayed on your public profile
        </p>
      </div>

      {/* Publish Availability Toggle */}
      <div className="space-y-2">
        <Label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={publishAvailability}
            onChange={(e) => setPublishAvailability(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <div className="font-medium text-foreground">Publish Availability to Public Profile</div>
            <div className="text-sm text-muted-foreground">Show availability tab on your artist profile</div>
          </div>
        </Label>
      </div>

      {/* Availability Mode */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">Availability Mode</Label>
        <div className="space-y-2">
          <Label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="availabilityMode"
              value="selected_dates_only"
              checked={availabilityMode === 'selected_dates_only'}
              onChange={() => setAvailabilityMode('selected_dates_only')}
              disabled={!publishAvailability}
              className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-foreground">Selected dates only, marked on calendar</div>
              <div className="text-sm text-muted-foreground">
                Only show dates you manually mark as available
              </div>
            </div>
          </Label>

          <Label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="availabilityMode"
              value="free_weekends"
              checked={availabilityMode === 'free_weekends'}
              onChange={() => setAvailabilityMode('free_weekends')}
              disabled={!publishAvailability}
              className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-foreground">Show all free Fri, Sat, Sun</div>
              <div className="text-sm text-muted-foreground">
                Automatically show all weekend days (each day evaluated independently)
              </div>
            </div>
          </Label>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <Label className="text-sm font-semibold text-foreground">Contact Information</Label>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className="text-sm text-foreground">
            Phone Number
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="+44 7123 456789"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={!publishAvailability}
            className="max-w-md"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsappNumber" className="text-sm text-foreground">
            WhatsApp Number
          </Label>
          <Input
            id="whatsappNumber"
            type="tel"
            placeholder="+44 7987 654321"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            disabled={!publishAvailability}
            className="max-w-md"
          />
        </div>
      </div>

      {/* Preferred Contact Method */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">Preferred Contact Method</Label>
        <div className="flex gap-4">
          <Label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="contactMethod"
              value="phone"
              checked={contactMethod === 'phone'}
              onChange={() => setContactMethod('phone')}
              disabled={!publishAvailability}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-foreground">Phone</span>
          </Label>

          <Label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="contactMethod"
              value="whatsapp"
              checked={contactMethod === 'whatsapp'}
              onChange={() => setContactMethod('whatsapp')}
              disabled={!publishAvailability}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-foreground">WhatsApp</span>
          </Label>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-200">Settings saved successfully!</p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="px-6"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </Card>
  );
}
