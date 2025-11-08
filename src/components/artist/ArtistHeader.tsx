"use client";

import { ArtistProfileData } from "@/lib/types/artist-profile";
import Image from "next/image";
import { useState } from "react";
import SocialMediaLinks from "./SocialMediaLinks";

interface ArtistHeaderProps {
  artist: ArtistProfileData;
}

export default function ArtistHeader({ artist }: ArtistHeaderProps) {
  const [showFullBio, setShowFullBio] = useState(false);

  // Check if bio is long enough to need truncation
  const bioNeedsTruncation = artist.bio && artist.bio.length > 200;
  const displayedBio = bioNeedsTruncation && !showFullBio
    ? artist.bio!.slice(0, 200) + "..."
    : artist.bio;

  return (
    <div className="relative">
      {/* Cover/Banner Area - Compact */}
      <div className="h-24 sm:h-32 md:h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-background relative overflow-hidden">
        {artist.profileImageUrl && (
          <div className="absolute inset-0 opacity-20">
            <Image
              src={artist.profileImageUrl}
              alt={`${artist.name} cover`}
              fill
              className="object-cover"
              priority
              quality={60}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        )}
      </div>

      {/* Profile Content - Compact mobile layout */}
      <div className="container mx-auto px-4 relative">
        <div className="flex items-start gap-3 md:gap-6 -mt-12 sm:-mt-10 md:-mt-12">
          {/* Profile Picture - Left side on mobile, larger */}
          <div className="relative flex-shrink-0">
            {artist.profileImageUrl ? (
              <Image
                src={artist.profileImageUrl}
                alt={`${artist.name} profile picture`}
                width={125}
                height={125}
                className="w-[125px] h-[125px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] rounded-full border-4 border-background shadow-lg object-cover"
                priority
                quality={90}
                sizes="(max-width: 640px) 125px, (max-width: 768px) 120px, 140px"
              />
            ) : (
              <div className="w-[125px] h-[125px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] rounded-full border-4 border-background shadow-lg bg-muted flex items-center justify-center">
                <span className="text-3xl sm:text-3xl font-bold text-muted-foreground">
                  {artist.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Artist Info - Right side on mobile, stacked */}
          <div className="flex-1 min-w-0 pt-2">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground mb-1 leading-tight">
              {artist.name}
            </h1>

            {/* Location */}
            {artist.location && (
              <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs sm:text-sm truncate">{artist.location}</span>
              </div>
            )}

            {/* Social Media Links - Mobile positioned here */}
            <div className="-ml-1.5">
              <SocialMediaLinks
                socialMediaUrls={artist.socialMediaUrls || []}
                artistId={artist.id}
                artistName={artist.name}
                className="justify-start"
              />
            </div>
          </div>
        </div>

        {/* Genres and Bio - Full width below on mobile */}
        <div className="mt-3">
          {/* Artist Type and Genre Badges */}
          {(artist.artistType || (artist.genres && artist.genres.length > 0)) && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {/* Artist Type Badge - Blue */}
              {artist.artistType && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full bg-blue-500 text-white whitespace-nowrap">
                  {artist.artistType.charAt(0).toUpperCase() + artist.artistType.slice(1)}
                </span>
              )}
              {/* Genre Badges - Orange */}
              {artist.genres && artist.genres.map((genre, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full bg-orange-500 text-white whitespace-nowrap"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {artist.bio && (
            <div className="mb-2.5">
              <p className="text-muted-foreground max-w-2xl leading-relaxed text-xs sm:text-sm">
                {displayedBio}
              </p>
              {bioNeedsTruncation && (
                <button
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="mt-1.5 text-primary hover:text-primary/80 text-xs font-medium transition-colors"
                  aria-expanded={showFullBio}
                  aria-label={showFullBio ? "Show less" : "Show more"}
                >
                  {showFullBio ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}