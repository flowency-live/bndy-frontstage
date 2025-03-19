// src/app/admin/venues/[venueid]/page.tsx
"use client";

import { VenueEdit } from "@/components/admin/edit/VenueEdit";
import { GoogleMapsProvider } from '@/components/providers/GoogleMapsProvider';
import { useParams } from "next/navigation";

export default function VenueEditPage() {
  // Use the useParams hook to get the venueid parameter
  const params = useParams();
  const venueid = params?.venueid as string;

  // If creating a new venue (no venueid), wrap with GoogleMapsProvider
  if (venueid === "new") {
    return (
      <GoogleMapsProvider autoLoad={true}>
        <VenueEdit />
      </GoogleMapsProvider>
    );
  }

  // Otherwise, editing existing venue
  return <VenueEdit venueId={venueid} />;
}