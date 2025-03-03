// /app/admin/artists/[artistid]/page.tsx
"use client";

import { use } from "react";
import { ArtistEdit } from "@/components/admin/edit/ArtistEdit";

// Define the props for the page component
interface ArtistEditPageProps {
  params: Promise<{
    artistid: string;
  }>;
}

export default function ArtistEditPage({ params }: ArtistEditPageProps) {
  // Properly unwrap the params using React.use()
  const resolvedParams = use(params);
  return <ArtistEdit artistId={resolvedParams.artistid} />;
}