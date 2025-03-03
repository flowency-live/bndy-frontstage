// /app/admin/venues/[venueid]/page.tsx
"use client";

import { use } from "react";
import { VenueEdit } from "@/components/admin/edit/VenueEdit";

// Define the props for the page component
interface VenueEditPageProps {
  params: Promise<{
    venueid: string;
  }>;
}

export default function VenueEditPage({ params }: VenueEditPageProps) {
  // Properly unwrap the params using React.use()
  const resolvedParams = use(params);
  return <VenueEdit venueId={resolvedParams.venueid} />;
}