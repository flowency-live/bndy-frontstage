"use client";

import { ArtistProfileData } from "@/lib/types/artist-profile";
import Image from "next/image";
import { Music, Share2, MapPin } from "lucide-react";

interface ArtistInfoProps {
  artist: ArtistProfileData;
  /** Pink breathing dot on the avatar — artist has upcoming gigs */
  hasUpcomingGigs?: boolean;
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
export default function ArtistInfo({ artist, hasUpcomingGigs }: ArtistInfoProps) {
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
          {hasUpcomingGigs && (
            <span className="profile-gigging-dot" title="Has upcoming gigs" />
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
                <span className="pin"><MapPin size={13} strokeWidth={2.2} /></span>
                <span>{artist.location}</span>
              </>
            )}
          </div>
        </div>

        {/* Action buttons — Share is the only universal artist action.
            (Follow removed until following exists; Spotify lives in the
            hero social icons when the artist actually has it.) */}
        <div className="profile-actions">
          <button onClick={handleShare} className="profile-btn primary">
            <Share2 className="w-[14px] h-[14px]" strokeWidth={2} />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
