"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building, Music, MapPin, Globe, Ticket } from "lucide-react";
import { FaFacebook, FaInstagram, FaSpotify, FaYoutube } from "react-icons/fa";
import { XIcon } from "@/components/ui/icons/XIcon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Artist,
  Venue,
  SocialMediaURL,
  SocialPlatform,
  getSocialMediaURLs,
} from "@/lib/types";
import { useViewToggle } from "@/context/ViewToggleContext";
import ProfilePictureFetcher from "@/lib/utils/ProfilePictureFetcher";
import { motion } from "framer-motion";

// Social media brand colors for hover effects
const SOCIAL_COLORS: Record<SocialPlatform, string> = {
  website: "#4F46E5",
  spotify: "#1DB954",
  facebook: "#1877F2",
  instagram: "#E4405F",
  youtube: "#FF0000",
  x: "#000000",
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const avatarVariants = {
  hidden: {
    scale: 0.8,
    opacity: 0
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  }
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

interface VADetailHeaderProps {
  item: Venue | Artist;
  type: "venue" | "artist";
  isEditing?: boolean;
  onChange?: (field: string, value: string) => void;
  overrideSocialMediaURLs?: SocialMediaURL[];
  onProfileImageUpdate?: (url: string) => void;
}

export default function VADetailHeader({
  item,
  type,
  isEditing = false,
  onChange,
  overrideSocialMediaURLs,
  onProfileImageUpdate,
}: VADetailHeaderProps) {
  const router = useRouter();
  const { isDarkMode } = useViewToggle();
  const isVenue = type === "venue";
  const isArtist = type === "artist";

  // Maintain local state for the profile picture.
  const [profileImageUrl, setProfileImageUrl] = useState(
    "profileImageUrl" in item ? item.profileImageUrl : ""
  );
  // New flag to avoid repeated fetch attempts.
  const [hasFetched, setHasFetched] = useState(false);

  // Get social media URLs using the shared helper function.
  // Use override URLs if provided (for edit mode)
  const socialMediaURLs: SocialMediaURL[] = overrideSocialMediaURLs || getSocialMediaURLs(item);

  // Look for Facebook and Instagram URLs.
  const fbURL = socialMediaURLs.find((s) => s.platform === "facebook")?.url;
  const igURL = socialMediaURLs.find((s) => s.platform === "instagram")?.url;

  // Determine primary color based on type.
  const primaryColor = isVenue ? "var(--secondary)" : "var(--primary)";
  const primaryColorClass = isVenue ? "text-cyan-500" : "text-[var(--primary)]";
  const primaryBgClass = isVenue ? "bg-cyan-500/10" : "bg-[var(--primary)]/10";

  // For edit mode, maintain local state for name and description.
  const [name, setName] = useState(item.name);

  // Get venue address if applicable
  const venueAddress = isVenue && 'address' in item ? item.address : null;
  const venuePostcode = isVenue && 'postcode' in item ? item.postcode : null;

  // Get artist genres if applicable
  const artistGenres = isArtist && 'genres' in item ? item.genres : null;

  //DEBUG BASK
  useEffect(() => {
    if (item.id === 'AfEtyU0MUaasfdcXrkxU') { // Bask venue ID
      console.log("BASK VENUE FULL DATA:", JSON.stringify(item, null, 2));
      console.log("BASK SOCIAL URLS:", JSON.stringify(socialMediaURLs, null, 2));

      // Check the specific Facebook URL that's causing problems
      const fbURL = socialMediaURLs.find(s => s.platform === 'facebook')?.url;
      console.log("BASK FB URL:", fbURL);

      // If using a URL constructor, let's see what we get
      try {
        if (fbURL) {
          const url = new URL(fbURL);
          console.log("BASK FB URL PARTS:", {
            protocol: url.protocol,
            hostname: url.hostname,
            pathname: url.pathname,
            search: url.search,
            hash: url.hash
          });
        }
      } catch (e) {
        console.error("BASK FB URL parsing error:", e);
      }
    }
  }, [item, socialMediaURLs]);



  useEffect(() => {
    console.log("Item updated:", item);
    setName(item.name);
    if ("profileImageUrl" in item) {
      console.log("Setting profile image:", item.profileImageUrl);
      setProfileImageUrl(item.profileImageUrl || "");
    }
  }, [item]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    onChange && onChange("name", e.target.value);
  };

  const handleProfilePictureFetched = (url: string) => {
    console.log("Profile picture fetched:", url);
    setProfileImageUrl(url);
    setHasFetched(true);

    // Update the parent component if callback is provided
    if (onProfileImageUpdate) {
      onProfileImageUpdate(url);
    }
  };

  // Social icon mapping function.
  const getSocialIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case "website":
        return <Globe className="w-5 h-5" />;
      case "spotify":
        return <FaSpotify className="w-5 h-5" />;
      case "facebook":
        return <FaFacebook className="w-5 h-5" />;
      case "instagram":
        return <FaInstagram className="w-5 h-5" />;
      case "youtube":
        return <FaYoutube className="w-5 h-5" />;
      case "x":
        return <XIcon className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--foreground)]" />
        </button>
      </div>

      {/* Main Content Container with animations */}
      <motion.div
        className="container max-w-5xl mx-auto px-4 py-6 pt-14"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-start gap-6">
          {/* Avatar with animation */}
          <motion.div
            variants={avatarVariants}
            className="w-32 h-32 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-xl"
            style={{
              backgroundColor: isVenue ? "var(--secondary-translucent)" : "var(--primary-translucent)",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)"
            }}
          >
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt=""
                className="object-cover w-full h-full"
                onError={() => {
                  console.log("Profile image failed to load; reverting to icon.");
                  setProfileImageUrl("");
                  setHasFetched(true);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white dark:bg-gray-800">
                {isVenue ? (
                  <Building className="w-16 h-16 text-[var(--secondary)]" />
                ) : (
                  <Music className="w-16 h-16 text-[var(--primary)]" />
                )}
              </div>
            )}
            {/* Mount the fetcher only once if no image is set */}
            {!profileImageUrl && !hasFetched && (
              <ProfilePictureFetcher
                facebookUrl={fbURL}
                instagramUrl={igURL}
                onPictureFetched={handleProfilePictureFetched}
              />
            )}
          </motion.div>

          {/* Content Section */}
          <div className="flex-1">
            {/* Name with animation */}
            <motion.div variants={itemVariants}>
              {isEditing ? (
                <Input
                  value={name}
                  onChange={handleNameChange}
                  className="text-2xl font-bold bg-transparent border-b border-[var(--foreground)] focus:outline-none"
                />
              ) : (
                <h1 className="text-2xl font-bold text-[var(--foreground)]">{name}</h1>
              )}
            </motion.div>

            {/* Venue Address or Artist Genres */}
            <motion.div variants={itemVariants}>
              {isVenue && venueAddress ? (
                <div className="flex items-center mt-2">
                  <MapPin className="w-4 h-4 mr-1 text-[var(--secondary)]" />
                  <span className="text-sm text-[var(--foreground)]/70">
                    {venueAddress}{venuePostcode ? `, ${venuePostcode}` : ""}
                  </span>
                </div>
              ) : isArtist && artistGenres && artistGenres.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {artistGenres.map((genre, index) => (
                    <span
                      key={index}
                      className={`px-2 py-0.5 rounded-full text-xs ${primaryColorClass} ${primaryBgClass}`}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              ) : null}
              {isVenue && !isEditing && 'standardTicketed' in item && item.standardTicketed && (
                <div className="flex items-center mt-2">
                  <Ticket className="w-4 h-4 mr-1 text-[var(--secondary)]" />
                  <span className="text-sm font-medium text-[var(--secondary)]">
                    Ticketed Venue
                  </span>
                </div>
              )}
            </motion.div>

            {/* Social Media Icons with animation */}
            <motion.div variants={itemVariants} className="flex gap-3 mt-3">
              {socialMediaURLs.length > 0 ? (
                socialMediaURLs.map((social, index) => {
                  const icon = getSocialIcon(social.platform);
                  const color = SOCIAL_COLORS[social.platform] || primaryColor;
                  return (
                    <motion.a
                      key={`${social.platform}-${index}`}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-all"
                      style={{ color }}
                      aria-label={`${social.platform} link`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {icon}
                    </motion.a>
                  );
                })
              ) : null}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </header>
  );
}