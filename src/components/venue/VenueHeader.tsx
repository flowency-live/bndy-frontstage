"use client";

import { Venue, getSocialMediaURLs } from "@/lib/types";
import Image from "next/image";
import { useState } from "react";
import SocialMediaLinks from "@/components/artist/SocialMediaLinks";
import { Building } from "lucide-react";
import ProfilePictureFetcher from "@/lib/utils/ProfilePictureFetcher";

interface VenueHeaderProps {
  venue: Venue;
}

export default function VenueHeader({ venue }: VenueHeaderProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(venue.profileImageUrl || venue.imageUrl || "");
  const [hasFetched, setHasFetched] = useState(false);

  // Check if description is long enough to need truncation
  const descriptionNeedsTruncation = venue.description && venue.description.length > 200;
  const displayedDescription = descriptionNeedsTruncation && !showFullDescription
    ? venue.description!.slice(0, 200) + "..."
    : venue.description;

  // Format address for display
  const fullAddress = [venue.address, venue.postcode].filter(Boolean).join(", ");

  // Get social media URLs to extract Facebook URL
  const socialMediaUrls = getSocialMediaURLs(venue);
  const fbURL = socialMediaUrls.find((s) => s.platform === "facebook")?.url;

  const handleProfilePictureFetched = (url: string) => {
    setProfileImageUrl(url);
    setHasFetched(true);
  };

  return (
    <div className="relative">
      {/* Cover/Banner Area - Compact - Using secondary (cyan) for venues */}
      <div className="h-24 sm:h-32 md:h-40 bg-gradient-to-br from-secondary/20 via-secondary/10 to-background relative overflow-hidden">
        {profileImageUrl && (
          <div className="absolute inset-0 opacity-20">
            <Image
              src={profileImageUrl}
              alt={`${venue.name} cover`}
              fill
              className="object-cover"
              priority
              quality={60}
              sizes="100vw"
              onError={() => {
                setProfileImageUrl("");
                setHasFetched(true);
              }}
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
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt={`${venue.name} profile picture`}
                width={125}
                height={125}
                className="w-[125px] h-[125px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] rounded-full border-4 border-background shadow-lg object-cover"
                priority
                quality={90}
                sizes="(max-width: 640px) 125px, (max-width: 768px) 120px, 140px"
                onError={() => {
                  setProfileImageUrl("");
                  setHasFetched(true);
                }}
              />
            ) : (
              <div className="w-[125px] h-[125px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] rounded-full border-4 border-background shadow-lg bg-muted flex items-center justify-center">
                <Building className="w-12 h-12 text-secondary" />
              </div>
            )}
            {!profileImageUrl && !hasFetched && (
              <ProfilePictureFetcher
                facebookUrl={fbURL}
                onPictureFetched={handleProfilePictureFetched}
              />
            )}
          </div>

          {/* Venue Info - Right side on mobile, stacked */}
          <div className="flex-1 min-w-0 pt-2">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground mb-1 leading-tight">
              {venue.name}
            </h1>

            {/* Address */}
            {fullAddress && (
              <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs sm:text-sm truncate">{fullAddress}</span>
              </div>
            )}

            {/* Social Media Links - Mobile positioned here */}
            <div className="-ml-1.5">
              <SocialMediaLinks
                socialMediaUrls={venue.socialMediaUrls || []}
                artistId={venue.id}
                artistName={venue.name}
                className="justify-start"
              />
            </div>
          </div>
        </div>

        {/* Facilities and Description - Full width below on mobile */}
        <div className="mt-3">
          {/* Facilities - Bold, vibrant cyan badges for venues */}
          {venue.facilities && venue.facilities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {venue.facilities.map((facility, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full bg-cyan-500 text-white whitespace-nowrap"
                >
                  {facility}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {venue.description && (
            <div className="mb-2.5">
              <p className="text-muted-foreground max-w-2xl leading-relaxed text-xs sm:text-sm">
                {displayedDescription}
              </p>
              {descriptionNeedsTruncation && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-1.5 text-secondary hover:text-secondary/80 text-xs font-medium transition-colors"
                  aria-expanded={showFullDescription}
                  aria-label={showFullDescription ? "Show less" : "Show more"}
                >
                  {showFullDescription ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
