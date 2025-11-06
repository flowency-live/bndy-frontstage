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
      {/* Cover/Banner Area */}
      <div className="h-40 sm:h-48 md:h-64 bg-gradient-to-br from-primary/20 via-primary/10 to-background relative overflow-hidden">
        {/* Optional: Add artist image as background with overlay */}
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

      {/* Profile Content */}
      <div className="container mx-auto px-4 relative">
        {/* Profile Picture - Positioned over cover area */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 sm:gap-6 -mt-12 sm:-mt-16 md:-mt-20">
          <div className="relative">
            {artist.profileImageUrl ? (
              <Image
                src={artist.profileImageUrl}
                alt={`${artist.name} profile picture`}
                width={120}
                height={120}
                className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] md:w-[150px] md:h-[150px] rounded-full border-4 border-background shadow-lg object-cover"
                priority
                quality={90}
                sizes="(max-width: 640px) 120px, (max-width: 768px) 140px, 150px"
              />
            ) : (
              <div className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] md:w-[150px] md:h-[150px] rounded-full border-4 border-background shadow-lg bg-muted flex items-center justify-center">
                <span className="text-3xl sm:text-4xl font-bold text-muted-foreground">
                  {artist.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Artist Info */}
          <div className="flex-1 text-center md:text-left pb-4 px-4 sm:px-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 leading-tight">
              {artist.name}
            </h1>
            
            {/* Location */}
            {artist.location && (
              <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground mb-3">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm sm:text-base">{artist.location}</span>
              </div>
            )}

            {/* Genres */}
            {artist.genres && artist.genres.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4 max-w-full">
                {artist.genres.map((genre, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/30 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 backdrop-blur-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {artist.bio && (
              <div className="mb-4">
                <p className="text-muted-foreground max-w-2xl leading-relaxed text-sm sm:text-base px-2 sm:px-0">
                  {displayedBio}
                </p>
                {bioNeedsTruncation && (
                  <button
                    onClick={() => setShowFullBio(!showFullBio)}
                    className="mt-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                    aria-expanded={showFullBio}
                    aria-label={showFullBio ? "Show less" : "Show more"}
                  >
                    {showFullBio ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            )}

            {/* Social Media Links */}
            <div className="mt-4">
              <SocialMediaLinks socialMediaUrls={artist.socialMediaUrls || []} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}