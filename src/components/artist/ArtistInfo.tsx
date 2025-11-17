"use client";

import { ArtistProfileData } from "@/lib/types/artist-profile";
import Image from "next/image";
import { useState } from "react";
import { MapPin } from "lucide-react";

interface ArtistInfoProps {
  artist: ArtistProfileData;
}

/**
 * ArtistInfo - Refactored artist profile information section
 *
 * Features:
 * - Profile image overlaps banner by 20px
 * - Layout order: Name → Bio/Subtitle → Location → Genres → Social Links
 * - ALL genre badges displayed (no artificial limit)
 * - Bio character limit (200 chars) with "Read more" expansion
 * - Theme-aware styling
 */
export default function ArtistInfo({ artist }: ArtistInfoProps) {
  const [showFullBio, setShowFullBio] = useState(false);

  // Bio character limit logic
  const BIO_CHAR_LIMIT = 200;
  const bioNeedsTruncation = artist.bio && artist.bio.length > BIO_CHAR_LIMIT;
  const displayedBio = bioNeedsTruncation && !showFullBio
    ? artist.bio!.slice(0, BIO_CHAR_LIMIT) + "..."
    : artist.bio;

  return (
    <div className="container mx-auto px-2 sm:px-4 relative" data-testid="artist-info-container">
      {/*
        AVATAR POSITIONING - DO NOT MODIFY NEGATIVE MARGINS

        Negative margins: -mt-16 (64px) / -mt-20 (80px) / -mt-24 (96px)
        Avatar sizes: 140px / 150px / 160px

        These values position the avatar center precisely at the banner/background boundary.
        CRITICAL: Changing these values will break the visual alignment.
      */}
      <div className="flex flex-col -mt-16 sm:-mt-20 md:-mt-24">
        <div className="relative flex-shrink-0">
          {artist.profileImageUrl ? (
            <Image
              src={artist.profileImageUrl}
              alt={`${artist.name} profile picture`}
              width={160}
              height={160}
              className="w-[140px] h-[140px] sm:w-[150px] sm:h-[150px] md:w-[160px] md:h-[160px] rounded-full border-4 border-background shadow-lg object-cover"
              priority
              quality={90}
              sizes="(max-width: 640px) 140px, (max-width: 768px) 150px, 160px"
            />
          ) : (
            <div className="w-[140px] h-[140px] sm:w-[150px] sm:h-[150px] md:w-[160px] md:h-[160px] rounded-full border-4 border-background shadow-lg bg-muted flex items-center justify-center">
              <span className="text-4xl font-bold text-muted-foreground">
                {artist.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Artist Name, Location, Bio - Below Avatar */}
        <div className="w-full mt-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 leading-tight">
            {artist.name}
          </h1>

          {/* Location and Artist Type Badge - Same row */}
          {(artist.location || artist.artistType) && (
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {artist.location && (
                <>
                  <MapPin className="w-4 h-4 flex-shrink-0 text-foreground" />
                  <span className="text-sm font-medium text-foreground">{artist.location}</span>
                </>
              )}
              {artist.artistType && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#4A90E2] text-white border border-[#4A90E2]/30">
                  {artist.artistType.charAt(0).toUpperCase() + artist.artistType.slice(1)}
                </span>
              )}
            </div>
          )}

          {/* Bio/Subtitle */}
          {artist.bio && (
            <p className="text-sm text-muted-foreground">
              {displayedBio}
              {bioNeedsTruncation && (
                <button
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="ml-1 text-primary hover:text-primary/80 font-medium transition-colors"
                  aria-expanded={showFullBio}
                  aria-label={showFullBio ? "Show less" : "Read more"}
                >
                  {showFullBio ? "Show less" : "Read more"}
                </button>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
