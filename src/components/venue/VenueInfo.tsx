"use client";

import { Venue, getSocialMediaURLs } from "@/lib/types";
import Image from "next/image";
import { useState } from "react";
import { Building, Share2, MapPin, Navigation } from "lucide-react";
import ProfilePictureFetcher from "@/lib/utils/ProfilePictureFetcher";

interface VenueInfoProps {
  venue: Venue;
}

/**
 * VenueInfo - Venue profile intro section (restyled)
 *
 * New grid layout: avatar | ident | actions
 * - Avatar: 88px mobile, 128px desktop, overlaps hero by negative margin
 * - Kind badge: VENUE (cyan)
 * - Name: Anton font, cyan color
 * - Meta line: address + distance
 * - Action buttons: Directions (primary), Share, Social icons
 *
 * Uses CSS classes from globals.css (.profile-*)
 */
export default function VenueInfo({ venue }: VenueInfoProps) {
  const [profileImageUrl, setProfileImageUrl] = useState(venue.profileImageUrl || venue.imageUrl || "");
  const [hasFetched, setHasFetched] = useState(false);

  // Format address for display
  const fullAddress = [venue.address, venue.postcode].filter(Boolean).join(", ");

  // Get social media URLs
  const socialMediaUrls = getSocialMediaURLs(venue);
  const fbURL = socialMediaUrls.find((s) => s.platform === "facebook")?.url;

  const handleProfilePictureFetched = (url: string) => {
    setProfileImageUrl(url);
    setHasFetched(true);
  };

  // Share handler
  const handleShare = async () => {
    const shareData = {
      title: venue.name,
      text: venue.description || `Check out ${venue.name} on bndy`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  // Directions handler
  const handleDirections = () => {
    const address = encodeURIComponent(fullAddress || venue.name);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
  };

  return (
    <div className="profile-wrap">
      <div className="profile-intro">
        {/* Avatar */}
        <div className="profile-avatar">
          {profileImageUrl ? (
            <Image
              src={profileImageUrl}
              alt={`${venue.name} profile picture`}
              width={128}
              height={128}
              className="w-full h-full object-cover"
              priority
              quality={90}
              sizes="(max-width: 720px) 88px, 128px"
              onError={() => {
                setProfileImageUrl("");
                setHasFetched(true);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--lv-surface)]">
              <Building className="w-10 h-10 text-[var(--lv-cyan)]" />
            </div>
          )}
          {!profileImageUrl && !hasFetched && (
            <ProfilePictureFetcher
              facebookUrl={fbURL}
              onPictureFetched={handleProfilePictureFetched}
            />
          )}
        </div>

        {/* Ident (name, badge, meta) */}
        <div className="profile-ident">
          {/* Kind badge */}
          <span className="profile-kind-badge venue">
            <Building className="w-[11px] h-[11px]" strokeWidth={2.4} />
            Venue
          </span>

          {/* Name */}
          <h1 className="profile-name venue">{venue.name}</h1>

          {/* Meta line */}
          <div className="profile-meta">
            {fullAddress && (
              <>
                <span className="pin">📍</span>
                <span>{fullAddress}</span>
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="profile-actions">
          <button onClick={handleDirections} className="profile-btn primary">
            <Navigation className="w-[14px] h-[14px]" />
            Directions
          </button>

          <button
            onClick={handleShare}
            className="profile-btn icon"
            aria-label="Share"
          >
            <Share2 className="w-[15px] h-[15px]" strokeWidth={1.8} />
          </button>

          {fbURL && (
            <a
              href={fbURL}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-btn icon"
              aria-label="Facebook"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px]">
                <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z"/>
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
