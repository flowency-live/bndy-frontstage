// src/components/events/AddEventButton.tsx - Public community event creation
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
import { useState } from 'react';
import { BaseEventWizard } from './BaseEventWizard';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface AddEventButtonProps {
  map?: google.maps.Map | null;
}

export function AddEventButton({ map }: AddEventButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Public button - no auth required for community event creation
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="add-event-button absolute bottom-20 md:bottom-2.5 right-4 md:right-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-full px-5 py-2.5 shadow-lg flex items-center z-50"
          style={{
            pointerEvents: 'auto'
          }}
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
              Create a new event by selecting a venue, artists, and event details
            </SheetDescription>
          </SheetHeader>
        </VisuallyHidden>
        <BaseEventWizard map={map} onSuccess={() => setIsOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}