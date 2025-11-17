"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Map, Users, Moon, Sun } from "lucide-react";
import { useViewToggle } from "@/context/ViewToggleContext";
import SocialMediaLinks from "./SocialMediaLinks";
import { SocialMediaURL } from "@/lib/types";

interface ArtistHeroBannerProps {
  socialMediaUrls?: SocialMediaURL[];
  artistId?: string;
  artistName?: string;
}

/**
 * ArtistHeroBanner - Generic hero banner for artist profile pages
 *
 * Features:
 * - Generic concert crowd image (same for all artists)
 * - Map icon button (top-left) - goes to main map (/)
 * - Artists icon button (top-right left of theme toggle) - goes to /artists
 * - Theme toggle (top-right)
 * - Social media icons (bottom-right) - ABSOLUTELY POSITIONED
 * - Dark gradient at bottom for profile image overlap
 * - Responsive: Mobile (200px) → Tablet (250px) → Desktop (300px)
 *
 * CRITICAL: Social icons are absolutely positioned (bottom-4 right-4).
 * DO NOT change to relative/static positioning as this will affect layout flow.
 */
export default function ArtistHeroBanner({ socialMediaUrls, artistId, artistName }: ArtistHeroBannerProps) {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useViewToggle();

  return (
    <div className="relative w-full h-[200px] sm:h-[250px] lg:h-[300px] overflow-hidden">
      {/* Generic Banner Image - Mobile */}
      <Image
        src="/images/bndy_landing_banner_mobile.jpg"
        alt="Concert crowd"
        fill
        priority
        className="object-cover object-center sm:hidden"
        sizes="100vw"
        style={{ objectFit: 'cover', objectPosition: 'center' }}
      />

      {/* Generic Banner Image - Desktop */}
      <Image
        src="/images/bndy_landing_banner.jpg"
        alt="Concert crowd"
        fill
        priority
        className="object-cover object-center hidden sm:block"
        sizes="100vw"
        style={{ objectFit: 'cover', objectPosition: 'center' }}
      />

      {/* Dark gradient at bottom for profile overlap */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

      {/* Transparent Controls Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
        {/* Map Button - Left */}
        <button
          onClick={() => router.push('/')}
          aria-label="Go to map"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 backdrop-blur-md text-white font-medium hover:bg-black/60 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          <Map className="w-5 h-5" />
          <span className="hidden sm:inline">Map</span>
        </button>

        {/* Right Controls - Artists + Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Artists Button */}
          <button
            onClick={() => router.push('/artists')}
            aria-label="Go to artists"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 backdrop-blur-md text-white font-medium hover:bg-black/60 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <Users className="w-5 h-5" />
            <span className="hidden sm:inline">Artists</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            {isDarkMode ? (
              <Sun className="w-6 h-6" />
            ) : (
              <Moon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Social Media Icons - Bottom Right */}
      {((socialMediaUrls && socialMediaUrls.length > 0) || (artistId && artistName)) && (
        <div className="absolute bottom-4 right-4 z-20">
          <SocialMediaLinks
            socialMediaUrls={socialMediaUrls || []}
            artistId={artistId}
            artistName={artistName}
            className="flex gap-2"
          />
        </div>
      )}
    </div>
  );
}
