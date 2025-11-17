"use client";

import { ArtistProfileData } from "@/lib/types/artist-profile";
import Image from "next/image";
import { useState } from "react";
import { MapPin } from "lucide-react";
import SocialMediaLinks from "./SocialMediaLinks";

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
    <div className="container mx-auto px-4 relative" data-testid="artist-info-container">
      {/* Semi-transparent background panel for text readability in both themes */}
      <div className="bg-background/90 dark:bg-background/85 backdrop-blur-sm rounded-xl p-4 shadow-lg -mt-16 sm:-mt-20 md:-mt-24">
      {/* Profile Image - Overlaps banner by 20px */}
      <div className="flex items-start gap-4">
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

        {/* Artist Name, Location, Bio */}
        <div className="flex-1 min-w-0 pt-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 leading-tight">
            {artist.name}
          </h1>

          {/* Location - Immediately below name */}
          {artist.location && (
            <div className="flex items-center gap-2 text-foreground mb-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">{artist.location}</span>
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

      {/* Genres and Social Links */}
      <div className="mt-4 space-y-3">
        {/* Genre Badges - ALL displayed, no limit - ORANGE */}
        {artist.genres && artist.genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {artist.genres.map((genre, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full text-white"
                style={{ backgroundColor: '#FF6B35' }}
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Social Media Links */}
        <div className="pt-2">
          <SocialMediaLinks
            socialMediaUrls={artist.socialMediaUrls || []}
            artistId={artist.id}
            artistName={artist.name}
          />
        </div>
      </div>
      </div>
    </div>
  );
}
