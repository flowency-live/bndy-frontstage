"use client";

import { Venue, getSocialMediaURLs } from "@/lib/types";
import Image from "next/image";
import { useState } from "react";
import { MapPin, Building } from "lucide-react";
import ProfilePictureFetcher from "@/lib/utils/ProfilePictureFetcher";

interface VenueInfoProps {
  venue: Venue;
}

/**
 * VenueInfo - Venue profile information section
 *
 * Features:
 * - Profile image overlaps banner
 * - Layout order: Name → Address → Facilities → Description
 * - Facilities badges (cyan-500 for venues)
 * - Description character limit (200 chars) with "Show more" expansion
 */
export default function VenueInfo({ venue }: VenueInfoProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(venue.profileImageUrl || venue.imageUrl || "");
  const [hasFetched, setHasFetched] = useState(false);

  // Description character limit logic
  const DESC_CHAR_LIMIT = 200;
  const descriptionNeedsTruncation = venue.description && venue.description.length > DESC_CHAR_LIMIT;
  const displayedDescription = descriptionNeedsTruncation && !showFullDescription
    ? venue.description!.slice(0, DESC_CHAR_LIMIT) + "..."
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
    <div className="container mx-auto px-2 sm:px-4 relative">
      {/* Avatar overlaps banner */}
      <div className="flex flex-col -mt-16 sm:-mt-20 md:-mt-24">
        <div className="relative flex-shrink-0">
          {profileImageUrl ? (
            <Image
              src={profileImageUrl}
              alt={`${venue.name} profile picture`}
              width={160}
              height={160}
              className="w-[140px] h-[140px] sm:w-[150px] sm:h-[150px] md:w-[160px] md:h-[160px] rounded-full border-4 border-background shadow-lg object-cover"
              priority
              quality={90}
              sizes="(max-width: 640px) 140px, (max-width: 768px) 150px, 160px"
              onError={() => {
                setProfileImageUrl("");
                setHasFetched(true);
              }}
            />
          ) : (
            <div className="w-[140px] h-[140px] sm:w-[150px] sm:h-[150px] md:w-[160px] md:h-[160px] rounded-full border-4 border-background shadow-lg bg-muted flex items-center justify-center">
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

        {/* Venue Name */}
        <div className="mt-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
            {venue.name}
          </h1>
        </div>

        {/* Address and Facilities - Same row */}
        {fullAddress && (
          <div className="flex items-center gap-2 flex-wrap mb-3 mt-2">
            <MapPin className="w-4 h-4 flex-shrink-0 text-foreground" />
            <span className="text-sm font-medium text-foreground">{fullAddress}</span>
          </div>
        )}

        {/* Facilities Badges - Cyan for venues */}
        {venue.facilities && venue.facilities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {venue.facilities.map((facility, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500 text-white whitespace-nowrap"
              >
                {facility}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {venue.description && (
          <div className="mb-4 max-w-2xl">
            <p className="text-muted-foreground leading-relaxed text-sm">
              {displayedDescription}
            </p>
            {descriptionNeedsTruncation && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="mt-2 text-secondary hover:text-secondary/80 text-sm font-medium transition-colors"
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
  );
}
