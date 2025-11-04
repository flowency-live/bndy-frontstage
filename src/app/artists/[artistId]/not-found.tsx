import { Metadata } from "next";
import ArtistNotFound from "@/components/artist/ArtistNotFound";

export const metadata: Metadata = {
  title: "Artist Not Found | bndy",
  description: "The artist you're looking for doesn't exist or has been removed.",
  robots: "noindex, nofollow"
};

export default function NotFound() {
  return (
    <ArtistNotFound 
      error="The artist you're looking for doesn't exist or has been removed."
    />
  );
}