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
        <div className={`flex justify-center flex-wrap gap-3 sm:gap-4 pt-2 ${className}`}>
          <ShareButton onClick={handleShare} showTooltip={showShareTooltip} />
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`flex justify-center flex-wrap gap-3 sm:gap-4 pt-2 ${className}`}>
      {socialMediaUrls.map((social, index) => {
        const config = platformConfig[social.platform];
        if (!config) return null;

        return (
          <a
            key={index}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-link focus-enhanced touch-feedback gpu-layer group relative w-12 h-12 sm:w-11 sm:h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] -webkit-tap-highlight-color: transparent;"
            style={{
              backgroundColor: `${config.color}15`, // 15% opacity
              border: `2px solid ${config.color}30` // 30% opacity
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${config.hoverColor}25`;
              e.currentTarget.style.borderColor = `${config.hoverColor}50`;
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${config.color}15`;
              e.currentTarget.style.borderColor = `${config.color}30`;
              e.currentTarget.style.transform = 'scale(1)';
            }}
            aria-label={`Visit ${config.label}`}
          >
            {/* Platform Icon */}
            <div 
              className="transition-all duration-200"
              style={{ color: config.color }}
            >
              {config.icon}
            </div>
            
            {/* Hover tooltip */}
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              {config.label}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>

            {/* Touch feedback ripple effect */}
            <div className="absolute inset-0 rounded-full opacity-0 group-active:opacity-30 transition-opacity duration-150"
                 style={{ backgroundColor: config.color }}></div>
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
  const shareConfig = {
    color: "#F97316", // Orange color matching bndy brand
    hoverColor: "#ea580c",
    label: showTooltip ? "Link copied!" : "Share"
  };

  return (
    <button
      onClick={onClick}
      className="social-link focus-enhanced touch-feedback gpu-layer group relative w-12 h-12 sm:w-11 sm:h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]"
      style={{
        backgroundColor: `${shareConfig.color}15`,
        border: `2px solid ${shareConfig.color}30`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${shareConfig.hoverColor}25`;
        e.currentTarget.style.borderColor = `${shareConfig.hoverColor}50`;
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = `${shareConfig.color}15`;
        e.currentTarget.style.borderColor = `${shareConfig.color}30`;
        e.currentTarget.style.transform = 'scale(1)';
      }}
      aria-label="Share artist profile"
    >
      {/* Share Icon */}
      <div
        className="transition-all duration-200"
        style={{ color: shareConfig.color }}
      >
        <IoShareSocialOutline className="w-5 h-5" />
      </div>

      {/* Hover tooltip */}
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {shareConfig.label}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>

      {/* Touch feedback ripple effect */}
      <div className="absolute inset-0 rounded-full opacity-0 group-active:opacity-30 transition-opacity duration-150"
           style={{ backgroundColor: shareConfig.color }}></div>
    </button>
  );
}