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

      {/* Profile Content - Compact */}
      <div className="container mx-auto px-4 relative">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-3 sm:gap-4 md:gap-6 -mt-8 sm:-mt-10 md:-mt-12">
          {/* Profile Picture - Smaller on mobile */}
          <div className="relative flex-shrink-0">
            {artist.profileImageUrl ? (
              <Image
                src={artist.profileImageUrl}
                alt={`${artist.name} profile picture`}
                width={100}
                height={100}
                className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] rounded-full border-4 border-background shadow-lg object-cover"
                priority
                quality={90}
                sizes="(max-width: 640px) 100px, (max-width: 768px) 120px, 140px"
              />
            ) : (
              <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] rounded-full border-4 border-background shadow-lg bg-muted flex items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold text-muted-foreground">
                  {artist.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Artist Info - Compact spacing */}
          <div className="flex-1 text-center md:text-left w-full md:w-auto pb-0 mb-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1.5 leading-tight">
              {artist.name}
            </h1>

            {/* Location - More compact */}
            {artist.location && (
              <div className="flex items-center justify-center md:justify-start gap-1.5 text-muted-foreground mb-2">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs sm:text-sm">{artist.location}</span>
              </div>
            )}

            {/* Genres - Subtle, compact badges */}
            {artist.genres && artist.genres.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-1.5 mb-2.5">
                {artist.genres.map((genre, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-0.5 bg-primary/10 text-primary/90 border border-primary/20 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Description - More compact */}
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

            {/* Social Media Links */}
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