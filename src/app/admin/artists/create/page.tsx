// /app/admin/artists/create/page.tsx
"use client";

import { ArtistEdit } from "@/components/admin/edit/ArtistEdit";

export default function CreateArtistPage() {
  // No artistId is passed, which puts the component in "create" mode
  return <ArtistEdit />;
}