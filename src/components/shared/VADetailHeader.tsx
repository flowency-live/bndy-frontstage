"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building, Music, Globe } from "lucide-react";
import { FaFacebook, FaInstagram, FaSpotify, FaYoutube } from "react-icons/fa";
import { XIcon } from "@/components/ui/icons/XIcon";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Artist,
  Venue,
  SocialMediaURL,
  SocialPlatform,
  getSocialMediaURLs,
} from "@/lib/types";
import { useViewToggle } from "@/context/ViewToggleContext";
import ProfilePictureFetcher from "@/lib/utils/ProfilePictureFetcher";

// Social media brand colors for hover effects
const SOCIAL_COLORS: Record<SocialPlatform, string> = {
  website: "#4F46E5",
  spotify: "#1DB954",
  facebook: "#1877F2",
  instagram: "#E4405F",
  youtube: "#FF0000",
  x: "#000000",
};

interface VADetailHeaderProps {
  item: Venue | Artist;
  type: "venue" | "artist";
  isEditing?: boolean;
  onChange?: (field: string, value: string) => void;
}

export default function VADetailHeader({
  item,
  type,
  isEditing = false,
  onChange,
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
  const socialMediaURLs: SocialMediaURL[] = getSocialMediaURLs(item);

  // Look for Facebook and Instagram URLs.
  const fbURL = socialMediaURLs.find((s) => s.platform === "facebook")?.url;
  const igURL = socialMediaURLs.find((s) => s.platform === "instagram")?.url;

  // Determine primary color & header background based on type.
  const primaryColor = isVenue ? "var(--secondary)" : "var(--primary)";
  const headerBgClass = isVenue
    ? "bg-[var(--venue-header-bg)]"
    : "bg-[var(--artist-header-bg)]";

  // For edit mode, maintain local state for name and description.
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(
    "description" in item ? item.description || "" : ""
  );

  useEffect(() => {
    setName(item.name);
    if ("description" in item) {
      setDescription(item.description || "");
    }
  }, [item]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    onChange && onChange("name", e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    onChange && onChange("description", e.target.value);
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
        return isDarkMode ? (
          <XIcon className="w-6 h-6" style={{ color: "#FFF" }} />
        ) : (
          <XIcon className="w-6 h-6" />
        );
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Header background with type-specific color */}
      <div className={`${headerBgClass} py-4 px-4 sm:px-8`}>
        {/* Top row: Back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--primary)]" />
          </button>
        </div>
        {/* Main header content */}
        <div className="flex items-center mt-4">
          {/* Avatar (left) */}
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden flex-shrink-0 mr-4 border-4"
            style={{ borderColor: primaryColor, backgroundColor: "var(--background)" }}
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
                  <Building className="w-10 h-10" style={{ color: "var(--secondary)" }} />
                ) : (
                  <Music className="w-10 h-10" style={{ color: "var(--primary)" }} />
                )}
              </div>
            )}
            {/* Mount the fetcher only once if no image is set */}
            {!profileImageUrl && !hasFetched && (
              <ProfilePictureFetcher
                facebookUrl={fbURL}
                instagramUrl={igURL}
                onPictureFetched={(url) => {
                  console.log("Fetched profile picture:", url);
                  setProfileImageUrl(url);
                  setHasFetched(true);
                }}
              />
            )}
          </div>
          {/* Title, description & social icons (right) */}
          <div className="flex-1">
            {isEditing ? (
              <>
                <Input
                  value={name}
                  onChange={handleNameChange}
                  className="text-2xl font-bold text-[var(--primary)] bg-transparent border-b border-[var(--primary)] focus:outline-none"
                />
                <Textarea
                  value={description}
                  onChange={handleDescriptionChange}
                  className="mt-2 text-sm text-[var(--foreground)] bg-transparent border-b border-[var(--foreground)] focus:outline-none"
                />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-[var(--primary)]">{name}</h1>
                <p className="mt-1 text-sm text-[var(--foreground)]">{description}</p>
              </>
            )}
            {/* Social Icons */}
            <div className="mt-2 flex items-center gap-3">
              {socialMediaURLs.length > 0 ? (
                socialMediaURLs.map((social) => {
                  const icon = getSocialIcon(social.platform);
                  const color = SOCIAL_COLORS[social.platform] || primaryColor;
                  return (
                    <a
                      key={social.platform}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors duration-200 hover:opacity-80"
                      style={{ color }}
                      aria-label={`${social.platform} link`}
                    >
                      {icon}
                    </a>
                  );
                })
              ) : (
                // If no socials provided, display a fallback icon.
                <div className="text-2xl" style={{ color: primaryColor }}>
                  {isVenue ? <Building /> : <Music />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
