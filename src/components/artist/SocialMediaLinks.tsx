"use client";

import { SocialMediaURL } from "@/lib/types";
import { FaFacebook, FaInstagram, FaYoutube, FaSpotify, FaXTwitter, FaGlobe } from "react-icons/fa6";

interface SocialMediaLinksProps {
  socialMediaUrls: SocialMediaURL[];
  className?: string;
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

export default function SocialMediaLinks({ socialMediaUrls, className = "" }: SocialMediaLinksProps) {
  if (!socialMediaUrls || socialMediaUrls.length === 0) {
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
    </div>
  );
}