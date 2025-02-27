// src/components/shared/EditModeToggle.tsx
"use client";

import { useState, useEffect } from 'react';
import { Edit, Save, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface EditModeToggleProps {
  type: 'artist' | 'venue';
  id: string;
  isEditing: boolean;
  onEditModeChange: (editing: boolean) => void;
  onSave: () => Promise<void>;
}

export default function EditModeToggle({ 
  type, 
  id, 
  isEditing, 
  onEditModeChange,
  onSave
}: EditModeToggleProps) {
  const { user, canEditArtist, canEditVenue } = useAuth();
  const [canEdit, setCanEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if the current user can edit this page
  useEffect(() => {
    const checkEditPermission = async () => {
      if (!user) {
        setCanEdit(false);
        return;
      }

      try {
        if (type === 'artist') {
          const hasPermission = await canEditArtist(id);
          setCanEdit(hasPermission);
        } else {
          const hasPermission = await canEditVenue(id);
          setCanEdit(hasPermission);
        }
      } catch (err) {
        console.error('Error checking edit permission:', err);
        setCanEdit(false);
      }
    };

    checkEditPermission();
  }, [user, id, type, canEditArtist, canEditVenue]);

  // If user can't edit, don't show the component
  if (!canEdit) {
    return null;
  }

  const handleToggleEdit = () => {
    onEditModeChange(!isEditing);
  };

  const handleCancel = () => {
    onEditModeChange(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await onSave();
      onEditModeChange(false);
    } catch (err) {
      console.error('Error saving changes:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-4 z-40 flex items-center gap-2">
      {error && (
        <div className="bg-red-500 text-white p-2 rounded-lg text-sm mr-2">
          {error}
        </div>
      )}

      {isEditing ? (
        <>
          <button
            onClick={handleCancel}
            className="p-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full text-[var(--foreground)] shadow-lg"
            aria-label="Cancel editing"
          >
            <X className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-full text-white shadow-lg"
            aria-label="Save changes"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            ) : (
              <Save className="w-5 h-5" />
            )}
          </button>
        </>
      ) : (
        <button
          onClick={handleToggleEdit}
          className="p-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-full text-white shadow-lg"
          aria-label="Edit page"
        >
          <Edit className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}