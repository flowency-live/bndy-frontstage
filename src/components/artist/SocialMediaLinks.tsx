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

// Platform-specific configurations with brand colors and react-icons
const platformConfig = {
  website: {
    icon: <FaGlobe className="w-5 h-5" />,
    color: "#6B7280",
    hoverColor: "#374151",
    label: "Website"
  },
  spotify: {
    icon: <FaSpotify className="w-5 h-5" />,
    color: "#1DB954",
    hoverColor: "#1ed760",
    label: "Spotify"
  },
  facebook: {
    icon: <FaFacebook className="w-5 h-5" />,
    color: "#1877F2",
    hoverColor: "#166fe5",
    label: "Facebook"
  },
  instagram: {
    icon: <FaInstagram className="w-5 h-5" />,
    color: "#E4405F",
    hoverColor: "#d73559",
    label: "Instagram"
  },
  youtube: {
    icon: <FaYoutube className="w-5 h-5" />,
    color: "#FF0000",
    hoverColor: "#e60000",
    label: "YouTube"
  },
  x: {
    icon: <FaXTwitter className="w-5 h-5" />,
    color: "#000000",
    hoverColor: "#1a1a1a",
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
        <div className={`flex justify-center gap-3 ${className}`}>
          <ShareButton onClick={handleShare} showTooltip={showShareTooltip} />
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`flex justify-center gap-3 ${className}`}>
      {socialMediaUrls.map((social, index) => {
        const config = platformConfig[social.platform];
        if (!config) return null;

        return (
          <a
            key={index}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label={`Visit ${config.label}`}
          >
            <div style={{ color: config.color }}>
              {config.icon}
            </div>
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
      className="transition-all duration-200 hover:scale-110 active:scale-95"
      aria-label="Share artist profile"
    >
      <div style={{ color: "#F97316" }}>
        <IoShareSocialOutline className="w-5 h-5" />
      </div>
    </button>
  );
}