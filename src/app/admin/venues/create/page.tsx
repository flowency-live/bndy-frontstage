// /app/admin/venues/create/page.tsx
"use client";

import { VenueEdit } from "@/components/admin/edit/VenueEdit";
import { GoogleMapsProvider } from '@/components/providers/GoogleMapsProvider';

export default function CreateVenuePage() {
  return (
    <GoogleMapsProvider autoLoad={true}>
      <VenueEdit />
    </GoogleMapsProvider>
  );
}