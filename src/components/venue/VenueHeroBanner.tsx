"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useViewToggle } from "@/context/ViewToggleContext";
import SocialMediaLinks from "@/components/artist/SocialMediaLinks";
import { SocialMediaURL } from "@/lib/types";

interface VenueHeroBannerProps {
  socialMediaUrls?: SocialMediaURL[];
  venueId?: string;
  venueName?: string;
}

/**
 * VenueHeroBanner - Generic hero banner for venue profile pages
 *
 * Features:
 * - Generic concert crowd image (same for all venues)
 * - Transparent back button (top-left)
 * - Transparent theme toggle (top-right)
 * - Social media icons (bottom-right) - ABSOLUTELY POSITIONED
 * - Dark gradient at bottom for profile image overlap
 * - Responsive: Mobile (200px) → Tablet (250px) → Desktop (300px)
 *
 * CRITICAL: Social icons are absolutely positioned (bottom-4 right-4).
 * DO NOT change to relative/static positioning as this will affect layout flow.
 */
export default function VenueHeroBanner({ socialMediaUrls, venueId, venueName }: VenueHeroBannerProps) {
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
        {/* Back Button - Left */}
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 backdrop-blur-md text-white font-medium hover:bg-black/60 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back</span>
        </button>

        {/* Theme Toggle - Right */}
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

      {/* Social Media Icons - Bottom Right */}
      {((socialMediaUrls && socialMediaUrls.length > 0) || (venueId && venueName)) && (
        <div className="absolute bottom-4 right-4">
          <SocialMediaLinks
            socialMediaUrls={socialMediaUrls || []}
            artistId={venueId}
            artistName={venueName}
            className="flex gap-2"
          />
        </div>
      )}
    </div>
  );
}
