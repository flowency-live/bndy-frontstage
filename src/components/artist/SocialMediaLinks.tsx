"use client";

import { SocialMediaURL } from "@/lib/types";
import { FaFacebook, FaInstagram, FaYoutube, FaSpotify, FaXTwitter, FaGlobe } from "react-icons/fa6";
import { IoShareSocialOutline } from "react-icons/io5";
import { useState } from "react";

interface SocialMediaLinksProps {
  socialMediaUrls: SocialMediaURL[];
  className?: string;
  artistId?: string;
  artistName?: string;
}

/**
 * Platform configurations - Ghosted, theme-aware style
 * - Transparent background (ghosted)
 * - Theme-aware borders and icon colors
 * - X logo for Twitter/X platform
 */
const platformConfig = {
  website: {
    icon: FaGlobe,
    label: "Website"
  },
  spotify: {
    icon: FaSpotify,
    label: "Spotify"
  },
  facebook: {
    icon: FaFacebook,
    label: "Facebook"
  },
  instagram: {
    icon: FaInstagram,
    label: "Instagram"
  },
  youtube: {
    icon: FaYoutube,
    label: "YouTube"
  },
  x: {
    icon: FaXTwitter,
    label: "X (Twitter)"
  }
};

export default function SocialMediaLinks({ socialMediaUrls, className = "", artistId, artistName }: SocialMediaLinksProps) {
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/artists/${artistId}`;
    const text = `Check out ${artistName} on bndy`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: artistName,
          text: text,
          url: url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2000);
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
    }
  };

  if (!socialMediaUrls || socialMediaUrls.length === 0) {
    // If no social media URLs but we have artist info, show only share button
    if (artistId && artistName) {
      return (
        <div className={`flex gap-3 ${className}`}>
          <ShareButton onClick={handleShare} showTooltip={showShareTooltip} />
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`flex gap-3 ${className}`}>
      {socialMediaUrls.map((social, index) => {
        const config = platformConfig[social.platform];
        if (!config) return null;

        const Icon = config.icon;

        return (
          <a
            key={index}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center rounded-lg border bg-transparent
                       border-gray-300 dark:border-gray-600
                       text-gray-700 dark:text-gray-200
                       hover:border-orange-500 hover:scale-105
                       transition-all duration-200"
            aria-label={`Visit ${config.label}`}
          >
            <Icon className="w-5 h-5" />
          </a>
        );
      })}

      {/* Share Button */}
      {artistId && artistName && (
        <ShareButton onClick={handleShare} showTooltip={showShareTooltip} />
      )}
    </div>
  );
}

// Share Button Component
function ShareButton({ onClick, showTooltip }: { onClick: () => void; showTooltip: boolean }) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 flex items-center justify-center rounded-lg border bg-transparent
                 border-gray-300 dark:border-gray-600
                 text-gray-700 dark:text-gray-200
                 hover:border-orange-500 hover:scale-105
                 transition-all duration-200"
      aria-label="Share artist profile"
    >
      <IoShareSocialOutline className="w-5 h-5" />
    </button>
  );
}