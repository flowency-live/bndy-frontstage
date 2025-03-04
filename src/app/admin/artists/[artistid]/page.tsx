// /app/admin/artists/[artistid]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArtistEdit } from "@/components/admin/edit/ArtistEdit";

export default function ArtistEditPage() {
  // Use the useParams hook to get the artistid parameter
  const params = useParams();
  const artistId = params?.artistid as string;

  return <ArtistEdit artistId={artistId} />;
}