// src/components/events/AddEventButton.tsx
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/Button";
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
import { useAuth } from '@/context/AuthContext';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface AddEventButtonProps {
  map?: google.maps.Map | null;
}

export function AddEventButton({ map }: AddEventButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isGodMode } = useAuth();

  // Only show the button if the user is an admin
  if (!isGodMode) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
      <Button
  className="fixed bottom-4 right-4 z-10 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-full px-6 py-3 shadow-lg"
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