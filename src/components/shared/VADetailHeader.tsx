import Link from "next/link";
import {
  ArrowLeft,
  Building,
  Music,
  Globe,
  ExternalLink,
} from "lucide-react";
import { FaFacebook, FaInstagram, FaSpotify, FaYoutube } from "react-icons/fa";
import { XIcon } from "@/components/ui/icons/XIcon";
import BndyIconLogo from "@/components/ui/BndyIconLogo";
import { Artist, Venue, SocialMediaURL, SocialPlatform, getSocialMediaURLs } from "@/lib/types";
import { useViewToggle } from "@/context/ViewToggleContext";

// Social media brand colors
const SOCIAL_COLORS = {
  website: "#4F46E5", // Indigo
  spotify: "#1DB954", // Spotify green
  facebook: "#1877F2", // Facebook blue
  instagram: "#E4405F", // Instagram red/pink
  youtube: "#FF0000", // YouTube red
  x: "#000000", // X black
};

interface VADetailHeaderProps {
  item: Venue | Artist;
  type: "venue" | "artist";
}

export default function VADetailHeader({ item, type }: VADetailHeaderProps) {
  const { isDarkMode } = useViewToggle();
  const isVenue = type === "venue";
  const isArtist = type === "artist";

  // Type guards
  const isVenueType = (val: Venue | Artist): val is Venue => type === "venue";
  const isArtistType = (val: Venue | Artist): val is Artist => type === "artist";

  // Get social media URLs using the helper function
  const socialMediaURLs = getSocialMediaURLs(item);

  // Google Maps URL builder (for Venues)
  const getGoogleMapsUrl = (venue: Venue) => {
    const query = `${venue.name}, ${venue.address || ""} ${venue.postcode || ""}`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  // Social platform icon mapping
  const getSocialIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case 'website':
        return <Globe className="w-5 h-5" />;
      case 'spotify':
        return <FaSpotify className="w-5 h-5" />;
      case 'facebook':
        return <FaFacebook className="w-5 h-5" />;
      case 'instagram':
        return <FaInstagram className="w-5 h-5" />;
      case 'youtube':
        return <FaYoutube className="w-5 h-5" />;
      case 'x':
        return isDarkMode ? (
          <XIcon className="w-6 h-6" style={{ color: "#FFF" }} />
        ) : (
          <XIcon className="w-6 h-6" />
        );
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  // Calculate primary color and header bg based on venue/artist type
  const primaryColor = isVenue ? "var(--secondary)" : "var(--primary)";
  const bgColorClass = isVenue ? "bg-[var(--venue-header-bg)]" : "bg-[var(--artist-header-bg)]";

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top color band with theme-aware background */}
      <div className={`relative ${bgColorClass} h-24`}>
        {/* Top bar: back button + brand logo */}
        <div className="flex items-center justify-between px-4 py-2">
          <Link href="/" className="p-1 rounded-full bg-white/10 hover:bg-white/20">
            <ArrowLeft className="w-5 h-5 text-[var(--primary)" />
          </Link>
        </div>

        {/* Avatar & Title at the bottom of the color band */}
        <div className="flex items-end px-4 pb-0 gap-4">
          {/* Avatar - larger with shadow and positioned to cross the color boundary */}
          <div
            className="h-24 w-24 rounded-full overflow-hidden flex-shrink-0 relative bottom-[-12px]"
            style={{ 
              boxShadow: "0 3px 8px rgba(0,0,0,0.15)", 
              border: `3px solid ${primaryColor}`,
              backgroundColor: "var(--background)",
            }}
          >
            {isVenueType(item) && item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full" />
            ) : isArtistType(item) && item.profileImageUrl ? (
              <img src={item.profileImageUrl} alt={item.name} className="object-cover w-full h-full" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-white dark:bg-gray-800">
                {isVenue ? (
                  <Building className="h-10 w-10" style={{ color: "var(--secondary)" }} />
                ) : (
                  <Music className="h-10 w-10" style={{ color: "var(--primary)" }} />
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div className="pb-10">
            <h1 className="text-2xl font-bold text-[var(--primary)">{item.name}</h1>
            
            {/* Move venue details up into the colored section for better alignment */}
            {isVenueType(item) && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {item.address ? item.address : "No address available"}
                {item.postcode && `, ${item.postcode}`}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Bottom Section with background color and social icons */}
      <div className="bg-[var(--background)] px-32 pt-3 pb-2">
            {/* Social Icons - aligned with proper brand colors */}
        {socialMediaURLs.length > 0 && (
          <div className="flex items-center gap-3">
            {socialMediaURLs.map((social: SocialMediaURL) => {
              const icon = getSocialIcon(social.platform);
              const color = SOCIAL_COLORS[social.platform] || primaryColor;
              
              return (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:opacity-80"
                  style={{ color: color }}
                  aria-label={`${social.platform} link`}
                >
                  {icon}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}