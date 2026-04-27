"use client";

import { ArtistProfileData } from "@/lib/types/artist-profile";
import Image from "next/image";
import { Music, Share2, Play } from "lucide-react";

interface ArtistInfoProps {
  artist: ArtistProfileData;
}

/**
 * ArtistInfo - Artist profile intro section (restyled)
 *
 * New grid layout: avatar | ident | actions
 * - Avatar: 88px mobile, 128px desktop, overlaps hero by negative margin
 * - Kind badge: BAND / SOLO ARTIST / DJ etc
 * - Name: Anton font, orange color
 * - Meta line: location + active since + piece count
 * - Action buttons: Follow (primary), Spotify, Share
 *
 * Uses CSS classes from globals.css (.profile-*)
 */
export default function ArtistInfo({ artist }: ArtistInfoProps) {
  // Format artist type for kind badge
  const getKindLabel = (artistType?: string) => {
    if (!artistType) return "Artist";
    const type = artistType.toLowerCase();
    if (type === "band" || type === "group") return "Band";
    if (type === "solo") return "Solo Artist";
    if (type === "duo") return "Duo";
    if (type === "trio") return "Trio";
    if (type === "dj") return "DJ";
    if (type === "collective") return "Collective";
    return artistType.charAt(0).toUpperCase() + artistType.slice(1);
  };

  // Get Spotify URL from socialMediaUrls if available
  const spotifyUrl = artist.socialMediaUrls?.find(
    (url: any) => url.platform === "spotify" || url.url?.includes("spotify")
  )?.url;

  // Share handler
  const handleShare = async () => {
    const shareData = {
      title: artist.name,
      text: artist.bio || `Check out ${artist.name} on bndy`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="profile-wrap">
      <div className="profile-intro">
        {/* Avatar */}
        <div className="profile-avatar">
          {artist.profileImageUrl ? (
            <Image
              src={artist.profileImageUrl}
              alt={`${artist.name} profile picture`}
              width={128}
              height={128}
              className="w-full h-full object-cover"
              priority
              quality={90}
              sizes="(max-width: 720px) 88px, 128px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--lv-surface)]">
              <span className="text-3xl font-bold text-[var(--lv-text-3)]">
                {artist.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Ident (name, badge, meta) */}
        <div className="profile-ident">
          {/* Kind badge */}
          <span className="profile-kind-badge artist">
            <Music className="w-[11px] h-[11px]" strokeWidth={2.4} />
            {getKindLabel(artist.artistType)}
          </span>

          {/* Name */}
          <h1 className="profile-name artist">{artist.name}</h1>

          {/* Meta line */}
          <div className="profile-meta">
            {artist.location && (
              <>
                <span className="pin">📍</span>
                <span>{artist.location}</span>
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="profile-actions">
          <button className="profile-btn primary">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[14px] h-[14px]">
              <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
            </svg>
            Follow
          </button>

          {spotifyUrl && (
            <a
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-btn icon"
              aria-label="Listen on Spotify"
            >
              <Play className="w-[15px] h-[15px]" fill="currentColor" />
            </a>
          )}

          <button
            onClick={handleShare}
            className="profile-btn icon"
            aria-label="Share"
          >
            <Share2 className="w-[15px] h-[15px]" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}
