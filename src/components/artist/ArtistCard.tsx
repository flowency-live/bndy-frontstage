/* src/components/artist/ArtistCard.tsx
   Neon glass artist tile — name inside the tile, photo-first with the
   ink + orange-wash fallback (Option A, signed off 2026-06-11).
   Styles: src/styles/bndy-ui.css (.bndy-artist-*) */
'use client';

import { Artist } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ArtistCardProps {
  artist: Artist;
  /** Pink breathing dot — artist has upcoming gigs (map language) */
  hasUpcomingGigs?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ArtistCard({ artist, hasUpcomingGigs }: ArtistCardProps) {
  const [imageError, setImageError] = useState(false);

  const showImage = artist.profileImageUrl && !imageError;
  const actType = artist.actType?.[0];
  const actTypeLabel = actType
    ? actType.charAt(0).toUpperCase() + actType.slice(1)
    : null;

  return (
    <Link href={`/artists/${artist.id}`} className="bndy-artist-tile">
      {showImage ? (
        <Image
          src={artist.profileImageUrl as string}
          alt={`${artist.name} profile picture`}
          fill
          className="bndy-artist-img"
          onError={() => setImageError(true)}
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 13vw"
          quality={85}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="bndy-artist-fallback" aria-hidden="true">
          {getInitials(artist.name)}
        </span>
      )}

      <span className="bndy-artist-grad" />

      {hasUpcomingGigs && (
        <span className="bndy-artist-gigging" title="Has upcoming gigs" />
      )}

      {actTypeLabel && <span className="bndy-artist-type">{actTypeLabel}</span>}

      <span className="bndy-artist-name">{artist.name}</span>
    </Link>
  );
}
