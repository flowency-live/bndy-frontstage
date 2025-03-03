// src/components/events/ArtistAddEventButton.tsx
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetHeader,
} from "@/components/ui/sheet";
import { useState, useEffect } from 'react';
import { BaseEventWizard } from './BaseEventWizard';
import { useAuth } from '@/context/AuthContext';
import type { Artist } from '@/lib/types';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface ArtistAddEventButtonProps {
  artist: Artist;
  className?: string;
}

export function ArtistAddEventButton({ artist, className }: ArtistAddEventButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isGodMode, canEditArtist } = useAuth();
  const [canEdit, setCanEdit] = useState(false);

  // Check permission to add event for this artist
  useEffect(() => {
    const checkPermission = async () => {
      if (isGodMode) {
        setCanEdit(true);
        return;
      }
      
      if (artist?.id) {
        const hasPermission = await canEditArtist(artist.id);
        setCanEdit(hasPermission);
      }
    };
    
    checkPermission();
  }, [artist?.id, isGodMode, canEditArtist]);

  // Only show the button if the user can edit this artist
  if (!canEdit) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
      <Button 
  className={`bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-medium ${className || ""}`}
>
  <Plus className="w-4 h-4 mr-2" />
  Add Event
</Button>
      </SheetTrigger>
      <SheetContent 
  side="left" 
  className="w-[400px] sm:w-[540px] bg-background border-r border-border safari-modal"
>
        <VisuallyHidden>
          <SheetHeader>
            <SheetTitle>Create New Event</SheetTitle>
            <SheetDescription>
              Create a new event for {artist.name}
            </SheetDescription>
          </SheetHeader>
        </VisuallyHidden>
        <BaseEventWizard 
          initialArtist={artist}
          skipArtistStep={true}
          onSuccess={() => setIsOpen(false)} 
        />
      </SheetContent>
    </Sheet>
  );
}